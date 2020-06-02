import test from 'ava';
import { validateServiceConfiguration } from './data-types';

test('accepts legal config', (t) => {
    t.deepEqual(
        validateServiceConfiguration({
            Port: 2,
            EthereumGenesisContract: 'foo',
            EthereumEndpoint: 'http://localhost:7545',
            boyarLegacyBootstrap: 'https://s3.amazonaws.com/orbs-bootstrap-prod/boyar/config.json',
            EthereumPollIntervalSeconds: 0.1,
            DockerHubPollIntervalSeconds: 0.1,
            FinalityBufferBlocks: 0,
            DockerNamespace: 'foo',
            verbose: true,
        }),
        undefined
    );
});

test('declines illegal config (1)', (t) => {
    t.deepEqual(
        validateServiceConfiguration({
            Port: 2,
            EthereumGenesisContract: 'foo',
            EthereumEndpoint: 'http://localhost:7545',
            boyarLegacyBootstrap: 'https://s3.amazonaws.com/orbs-bootstrap-prod/boyar/config.json',
            EthereumPollIntervalSeconds: 0.1,
            DockerHubPollIntervalSeconds: 0.1,
            DockerNamespace: 'foo',
            verbose: true,
        }),
        ["Finality buffer blocks can't be blank"]
    );
});
test('declines illegal config (2)', (t) => {
    t.deepEqual(
        validateServiceConfiguration({
            Port: 2,
            EthereumGenesisContract: 'foo',
            EthereumEndpoint: 'foo-bar:123',
            boyarLegacyBootstrap: 'https://s3.amazonaws.com/orbs-bootstrap-prod/boyar/config.json',
            EthereumPollIntervalSeconds: 0.1,
            DockerHubPollIntervalSeconds: 0.1,
            FinalityBufferBlocks: 0,
            DockerNamespace: 'foo',
            verbose: true,
        }),
        ['Ethereum endpoint is not a valid url']
    );
});
