import test from 'ava';
import { join } from 'path';
import { TestEnvironment } from './driver';
import { day, sleep, year } from '../src/helpers';
import { deepDataMatcher } from './deep-matcher';
import { expectationNodeManagement } from './expectations-node';
import { expectationVcManagement } from './expectations-vc';

let stateReadyBlockTime = 0;
const driver = new TestEnvironment(join(__dirname, 'docker-compose.yml'));
driver.launchServices();

test.serial.before(async (t) => {
  t.log('[E2E] set up ethereum state');
  t.timeout(60 * 1000);
  await driver.ethereum.setupInitialCommittee();
  await driver.ethereum.addVchain(30 * day);
  await driver.ethereum.addVchain(30 * day);
  await driver.ethereum.upgradeProtocolVersion(17, 60 * day);
  await driver.ethereum.increaseTime(40 * day);
  await driver.ethereum.extendVchain('1000000', 90 * day);
  await driver.ethereum.upgradeProtocolVersion(19, 2 * day);
  await driver.ethereum.addVchain(90 * day);
  await driver.ethereum.increaseTime(10 * day);
  await driver.ethereum.increaseBlocks(1);
  await driver.ethereum.increaseBlocks(300); // for virtual chain genesis, TODO: remove after temp genesis block hack (!)
  stateReadyBlockTime = await driver.ethereum.getCurrentBlockTime();
  await driver.ethereum.increaseBlocks(driver.getAppConfig().FinalityBufferBlocks);
  t.log('[E2E] set up ethereum state done, block time:', stateReadyBlockTime);
});

test.serial('[E2E] serves /node/management as expected', async (t) => {
  t.log('started');

  driver.testLogger = t.log;
  t.timeout(60 * 1000);

  t.log('fetching node/management');
  let res = await driver.fetch('app', 8080, 'node/management');
  while (!res || isErrorResponse(res) || res.chains.length < 3) {
    await sleep(1000);
    t.log('fetching node/management again, since last response:', res);
    res = await driver.fetch('app', 8080, 'node/management');
  }

  t.log('[E2E] result:', JSON.stringify(res, null, 2));

  const errors = deepDataMatcher(res, expectationNodeManagement);
  t.deepEqual(errors, []);
});

test.serial('[E2E] serves /vchains/1000000/management as expected', async (t) => {
  t.log('started');

  driver.testLogger = t.log;
  t.timeout(60 * 1000);

  t.log('fetching vchains/1000000/management');
  let res = await driver.fetch('app', 8080, 'vchains/1000000/management');
  while (!res || isErrorResponse(res) || res.CurrentRefTime < stateReadyBlockTime) {
    await sleep(1000);
    console.log('fetching node/management again, since last response:', res);
    t.log('fetching vchains/1000000/management again, since last response:', res);
    res = await driver.fetch('app', 8080, 'vchains/1000000/management');
  }

  t.log('[E2E] result:', JSON.stringify(res, null, 2));

  const errors = deepDataMatcher(res, expectationVcManagement);
  t.deepEqual(errors, []);
});

test.serial('[E2E] serves /vchains/1000000/management/time as expected', async (t) => {
  t.log('started');

  driver.testLogger = t.log;
  t.timeout(60 * 1000);

  t.log('fetching vchains/1000000/management/time within limit');
  let res = await driver.fetch('app', 8080, `vchains/1000000/management/${stateReadyBlockTime}`);
  while (!res || isErrorResponse(res) || res.CurrentRefTime < stateReadyBlockTime) {
    await sleep(1000);
    console.log('fetching node/management/time again, since last response:', res);
    t.log('fetching vchains/1000000/management/time again, since last response:', res);
    res = await driver.fetch('app', 8080, `vchains/1000000/management/${stateReadyBlockTime}`);
  }

  t.log('[E2E] result:', JSON.stringify(res, null, 2));

  const errors = deepDataMatcher(res, expectationVcManagement);
  t.deepEqual(errors, []);

  t.log('fetching vchains/1000000/management/time beyond limit');
  res = await driver.fetch('app', 8080, `vchains/1000000/management/${stateReadyBlockTime + year}`);

  t.log('[E2E] result:', res);

  t.true(isErrorResponse(res));
});

function isErrorResponse(res: any): res is { error: string; stack?: string | undefined; status: 'error' } {
  return res && res.status === 'error';
}
