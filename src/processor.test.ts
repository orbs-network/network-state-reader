import test from 'ava';
import { Processor } from './processor';
import nock from 'nock';
import { DockerConfig } from './data-types';

test.serial.afterEach.always(() => {
    nock.cleanAll();
});

function nockDockerHub(...repositories: { user: string; name: string; tags: string[] }[]) {
    nock(/docker/); // prevent requests to docker domain from goinig to network
    nock('https://auth.docker.io') // allow asking for token from auth
        .get(/token/)
        .times(repositories.length) // once per repo
        .reply(200, { token: 'token placeholder' });

    let registryScope = nock('https://registry.hub.docker.com'); // expect polling tags list
    for (const repository of repositories) {
        registryScope = registryScope
            .get(`/v2/${repository.user}/${repository.name}/tags/list`) // for each repo
            .reply(200, { tags: repository.tags });
    }
    return registryScope;
}

test.serial('fetchLatestTagElement gets latest tag from docker hub', async t => {
    const repository = { user: 'orbsnetwork', name: 'node' };
    const tags = ['audit', 'G-2-N', 'G-0-N', 'G-1-N', 'foo G-6-N bar', 'v1.0.10', '0432a81f'];
    const scope = nockDockerHub({ ...repository, tags });
    const tag = await Processor.fetchLatestTagElement(repository);
    t.deepEqual(tag, 'foo G-6-N bar');
    scope.done();
});

test.serial('updateDockerConfig updates tags with minimal requests', async t => {
    const originalConfiguration = [
        {
            Image: 'foo/bar',
            Tag: 'foo1'
        },
        {
            Image: 'foo/bar',
            Tag: 'G-1-N'
        },
        {
            Image: 'fizz/baz',
            Tag: 'foo3'
        }
    ] as DockerConfig[];
    const scope = nockDockerHub({ user: 'foo', name: 'bar', tags: ['G-3-N'] }, { user: 'fizz', name: 'baz', tags: [] });
    const processor = new Processor();
    const newConfig = await Promise.all(originalConfiguration.map(dc => processor.updateDockerConfig(dc)));

    t.deepEqual(newConfig, [
        {
            Image: 'foo/bar',
            Tag: 'G-3-N',
            Pull: true
        },
        {
            Image: 'foo/bar',
            Tag: 'G-3-N',
            Pull: true
        },
        {
            Image: 'fizz/baz',
            Tag: 'foo3'
        }
    ] as DockerConfig[]);

    scope.done();
});