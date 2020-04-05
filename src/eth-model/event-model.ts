import { EventData } from 'web3-eth-contract';

export type EventBlockData = {
    time: number;
    blockNumber: number;
    events: Array<EventData>;
};

/**
 * creates a matcher for given event within the same block.
 * used to de-dupe events in block model
 */
function getEventMatcher(event: EventData) {
    if (event.transactionHash && typeof event.logIndex != 'undefined') {
        return (e: EventData) => e.transactionHash === event.transactionHash && e.logIndex === event.logIndex;
    } else {
        // mock data, never drop
        return () => false;
    }
}

// TODO what happens in a re-org? should we confirm blockHash of events match block ?
export class EventModel {
    private eventsPerBlock = new Array<EventBlockData>();
    private nextBlock = 0;
    constructor() {
        this.eventsPerBlock.push({ time: -1, blockNumber: -1, events: [] });
    }

    getNextBlock() {
        return Math.max(this.nextBlock, this.eventsPerBlock[this.eventsPerBlock.length - 1].blockNumber + 1);
    }

    setNextBlock(nextBlock: number) {
        this.nextBlock = nextBlock;
    }

    rememberEvent(event: EventData, blockTime: number) {
        for (let i = this.eventsPerBlock.length - 1; i >= 0; --i) {
            const block = this.eventsPerBlock[i];
            if (block.blockNumber == event.blockNumber) {
                // no duplicate events
                if (!block.events.find(getEventMatcher(event))) {
                    block.events.push(event);
                }
                return;
            } else if (block.blockNumber < event.blockNumber) {
                // create new block here
                this.eventsPerBlock.splice(i + 1, 0, {
                    time: blockTime,
                    blockNumber: event.blockNumber,
                    events: [event],
                });
                return;
            }
        }
        throw new Error(`can't find place for event : ${JSON.stringify(event)}`);
    }

    getIndexOfBlockAfterTime(fromTime: number) {
        let min = 0;
        let max = this.eventsPerBlock.length - 1;
        while (min < max) {
            const k = Math.floor((max + min) / 2);
            if (this.eventsPerBlock[k].time < fromTime) {
                // too early
                min = k + 1;
            } else if (this.eventsPerBlock[k].time > fromTime) {
                // too late
                max = k - 1;
            } else {
                return k;
            }
        }
        return min;
    }

    getEvents(fromTime: number): EventData[] {
        const fromIdx = this.getIndexOfBlockAfterTime(fromTime);
        return this.eventsPerBlock.slice(fromIdx).flatMap((b) => b.events);
    }
}