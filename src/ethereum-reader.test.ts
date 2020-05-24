import test from 'ava';
import { Driver, createVC } from '@orbs-network/orbs-ethereum-contracts-v2';
import { EthereumReader, EthereumConfigReader } from './ethereum-reader';
import { range, nowUTC } from './utils';

test.serial('EthereumReader reads getRefTime', async (t) => {
    t.timeout(60 * 1000);
    await createVC(await Driver.new()); // create a block

    const reader = new EthereumReader({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        contracts: null as any,
        firstBlock: 0,
        httpEndpoint: 'http://localhost:7545',
    });

    const refTime = (await reader.getRefTime('latest')) || -1;
    t.assert(1 + nowUTC() - refTime > 0, `time is before now(): ${refTime}`);
    t.assert(nowUTC() - refTime < 60, `time is not too much before now(): ${nowUTC() - refTime}`);
});

test.serial('EthereumReader reads VCs from SubscriptionChanged events', async (t) => {
    t.timeout(60 * 1000);
    const d = await Driver.new();
    const numnberOfVChains = 5;

    for (const _ of new Array(numnberOfVChains)) {
        await createVC(d);
    }

    const reader = new EthereumReader({
        contracts: Promise.resolve({
            subscriptions: { address: d.subscriptions.web3Contract.options.address, firstBlock: 0 },
        }),
        firstBlock: 0,
        httpEndpoint: 'http://localhost:7545',
    });

    const vcs = await reader.getAllVirtualChains();
    t.deepEqual(vcs.length, numnberOfVChains, 'number of VChains');
    t.deepEqual(
        vcs,
        range(numnberOfVChains).map((i) => `${i + 1000000}`),
        'exact match of virtual chains IDs. Requires update when contracts change' // fragile, coupled with contract
    );
});

test.serial('EthereumConfigReader reads registry for contracts address', async (t) => {
    t.timeout(60 * 1000);
    const d = await Driver.new();
    const numnberOfVChains = 5;

    for (const _ of new Array(numnberOfVChains)) {
        await createVC(d);
    }

    const reader = new EthereumConfigReader({
        EthereumGenesisContract: d.contractRegistry.web3Contract.options.address,
        EthereumEndpoint: 'http://localhost:7545',
        FirstBlock: 0,
    });

    const config = reader.readEthereumConfig();
    t.deepEqual(config.httpEndpoint, 'http://localhost:7545');
    t.deepEqual((await config.contracts).subscriptions?.address, d.subscriptions.web3Contract.options.address);
});
