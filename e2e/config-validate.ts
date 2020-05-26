import { getVirtualChainPort } from '../src/ports';
import { isNumber } from 'util';
import { deepDataMatcher } from '../src/test-kit';
import { getIpFromHex } from '../src/utils';
import { addParticipant } from '../src/pos-v2-simulations';
import { Dictionary } from 'lodash';
import { validatorRegisteredEvents, standbysChangedEvents, committeeChangedEvents } from '@orbs-network/orbs-ethereum-contracts-v2';
import {
    StandbysChangedPayload,
    CommitteeChangedPayload,
    ValidatorRegisteredPayload,
} from '../src/eth-model/events-types';
/*
Below is the expected behaviour of the management service in the E2E test.
The goal is to keep the expectations as static as reasonably possible, to help readability.
The dynamic parts in the boyar endpoint are:
 - the number of virtual chains to match
 - the `Id` and `ExternalPort` properties of virtual chain configurations
 - the configuration of the management service itself (determined by test fixture)
current format is based on example from:
https://raw.githubusercontent.com/orbs-network/orbs-spec/master/config-examples/node-management.json
*/

/**
 * @param appConfig actual E2E fixture settings
 */
export function getBoyarConfigValidator(appConfig: object, vChainIds: string[]) {
    const expected = {
        network: [],
        orchestrator: {
            DynamicManagementConfig: {
                ReadInterval: '1m',
                ResetTimeout: '30m',
                Url: 'http://localhost:7666/node/management',
            },
            'storage-driver': 'nfs',
            'storage-options': {
                maxRetries: '10',
            },
        },
        chains: vChainIds.map(getExpectedVirtualChainConfiguration),
        services: {
            'management-service': {
                InternalPort: 8080,
                ExternalPort: 7666,
                DockerConfig: {
                    Image: 'orbsnetwork/management-service',
                    Tag: 'G-0-N', // v0.0.1
                    Pull: undefined, // true
                },
                Config: appConfig,
            },
            signer: {
                InternalPort: 7777,
                DockerConfig: {
                    Image: 'orbsnetwork/signer',
                    Tag: 'v1.3.13',
                    Pull: true,
                },
                Config: {
                    api: 'v1',
                },
            },
        },
    };
    return (res: any) => deepDataMatcher(res, expected);
}

function getExpectedVirtualChainConfiguration(vcid: string) {
    return {
        Config: {
            ManagementConfigUrl: `http://management-service/vchains/${vcid}/management`,
            SignerUrl: 'http://signer:7777',
            'ethereum-endpoint': 'http://eth.orbs.com',
        },
        DockerConfig: {
            Image: 'orbsnetwork/node',
            Resources: {
                Limits: {
                    CPUs: 1,
                    Memory: 1024,
                },
                Reservations: {
                    CPUs: 0.5,
                    Memory: 512,
                },
            },
            Tag: 'v1.3.13',
        },
        ExternalPort: getVirtualChainPort(vcid),
        Id: vcid,
        InternalHttpPort: 8080,
        InternalPort: 4400,
    };
}
/**
 * extract the value type from a promise type
 */
type Await<T> = T extends PromiseLike<infer U> ? U : T

type ParticipantResult = Await<ReturnType<typeof addParticipant>>;
export function getOngConfigValidator(vcid: string, comittyResult: ParticipantResult, participantResult: ParticipantResult, committeeContractAddress: string) {
    const ips: Dictionary<string> = {};
    const participant1Registraion = validatorRegisteredEvents(
        comittyResult.validatorTxResult
    )[0] as ValidatorRegisteredPayload;
    const participant2Registraion = validatorRegisteredEvents(
        participantResult.validatorTxResult
    )[0] as ValidatorRegisteredPayload;

    ips[participant1Registraion.orbsAddr] = getIpFromHex(participant1Registraion.ip);
    ips[participant2Registraion.orbsAddr] = getIpFromHex(participant2Registraion.ip);
    // the last event contains data on entire topology
    const standbyEvent = standbysChangedEvents(
        participantResult.syncTxResult,
        committeeContractAddress
    )[0] as StandbysChangedPayload;
    const comittyEvent = committeeChangedEvents(
        comittyResult.commiteeTxResult,
        committeeContractAddress
    )[0] as CommitteeChangedPayload;

    const expected = {
        CurrentRefTime: isNumber,
        PageStartRefTime: isNumber,
        PageEndRefTime: isNumber,
        VirtualChains: {
            [vcid]: {
                VirtualChainId: vcid,
                CurrentTopology: [
                    {
                        OrbsAddress: standbyEvent.orbsAddrs[0],
                        Ip: ips[standbyEvent.orbsAddrs[0]],
                        Port: getVirtualChainPort(vcid),
                    },
                    {
                        OrbsAddress: comittyEvent.orbsAddrs[0],
                        Ip: ips[comittyEvent.orbsAddrs[0]],
                        Port: getVirtualChainPort(vcid),
                    },
                ],
                CommitteeEvents: [
                    {
                        Committee: [
                            {
                                EthAddress: comittyEvent.addrs[0],
                                OrbsAddress: comittyEvent.orbsAddrs[0],
                                EffectiveStake: parseInt(comittyEvent.weights[0]),
                                IdentityType: 0,
                            },
                        ],
                    },
                ],
                SubscriptionEvents: [
                    {
                        RefTime: isNumber,
                        Data: {
                            Status: 'active',
                            Tier: 'defaultTier',
                            RolloutGroup: 'ga',
                            IdentityType: 0,
                            Params: {},
                        },
                    },
                ],
            },
        },
    };
    return (res: any) => deepDataMatcher(res, expected);
}
