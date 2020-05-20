import test from 'ava';
import { isValid, compare } from './versioning';

test('isValid returns true on valid versions', (t) => {
    const validTags = [
        'v0.0.0',
        'v1.22.333',
        'v0.0.0-canary',
        'v0.0.0+hotfix',
        'v1.22.333+hotfix',
        'v0.0.0-canary+hotfix',
    ];
    for (const tag of validTags) {
        t.true(isValid(tag), tag);
    }
});

test('isValid returns false on invalid versions', (t) => {
    const invalidTags = [
        'G-0-H',
        'C-0-N',
        '0.0.0',
        'v0.0.0 foo',
        'foo v0.0.0',
        'v0.0',
        'v0.0.',
        'v0.0.0 -canary',
        'v0.0.0-canar y',
        'v01.22.333',
        'v0.0.0-ferrary',
        'v0.0.0-ferrary+slow',
    ];
    for (const tag of invalidTags) {
        t.false(isValid(tag), tag);
    }
});

test('copmpare sorts the latest version at the smallest index', (t) => {
    const validTags = [
        'v1.1.4-canary',
        'v1.0.6-canary+hotfix',
        'v0.0.8',
        'v0.0.1+hotfix',
        'v0.0.0',
        '',
        'v0.2.5',
        'v1.0.0',
        'v1.1.3',
        'v0.20.0+hotfix',
        '',
        'v0.2.0-canary',
        'v1.11.0',
        'v1.1.0',
    ];
    const sorted = validTags.sort(compare);
    // console.log(sorted);
    t.deepEqual(sorted, [
        '',
        '',
        'v0.0.0',
        'v0.0.1+hotfix',
        'v0.0.8',
        'v0.2.0-canary',
        'v0.2.5',
        'v0.20.0+hotfix',
        'v1.0.0',
        'v1.0.6-canary+hotfix',
        'v1.1.0',
        'v1.1.3',
        'v1.1.4-canary',
        'v1.11.0',
    ]);
});
