import test from 'ava';
import { parseArgs } from './cli-args';
import mock from 'mock-fs';
import { ServiceConfiguration, validateServiceConfiguration } from './config';

test.serial.afterEach.always(() => {
  mock.restore();
});

const configPath = 'some/path/config.json';

const minimalConfigValue = {
  EthereumGenesisContract: 'bar',
  EthereumEndpoint: 'http://localhost:7545',
  'node-address': '16fcf728f8dc3f687132f2157d8379c021a08c12',
};
const configValue: ServiceConfiguration = {
  ...minimalConfigValue,
  BootstrapMode: false,
  Port: -1,
  EthereumFirstBlock: 0,
  EthereumPollIntervalSeconds: 0.5,
  EthereumRequestsPerSecondLimit: 0,
  ElectionsStaleUpdateSeconds: 7 * 24 * 60 * 60,
  RegularRolloutWindowSeconds: 1,
  HotfixRolloutWindowSeconds: 1,
  DockerHubPollIntervalSeconds: 1,
  FinalityBufferBlocks: 0,
  DockerNamespace: 'foo',
  DockerRegistry: 'bar',
  Verbose: true,
};

test.serial('parseOptions with file', (t) => {
  mock({
    [configPath]: JSON.stringify(configValue),
  });

  t.deepEqual(parseArgs(['--config', configPath]), configValue);
});

test.serial('parseOptions with partial file (complete default values)', (t) => {
  mock({
    [configPath]: JSON.stringify(minimalConfigValue),
  });

  const options = parseArgs(['--config', configPath]);
  t.deepEqual(validateServiceConfiguration(options), undefined);
});

test.serial('parseOptions with no file', (t) => {
  t.throws(() => parseArgs(['--config', configPath]));
});

test.serial('parseOptions with no config', (t) => {
  t.throws(() => parseArgs([]));
});
