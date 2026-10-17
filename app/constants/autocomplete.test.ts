// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {CHANNEL_MENTION_REGEX, CHANNEL_MENTION_REGEX_DELAYED, MENTIONS_REGEX} from './autocomplete';

describe('test regular expressions', () => {
    test.each([
        ['test @mention', ['@mention']],
        ['test @mention.', ['@mention']],
        ['test @mention_', ['@mention_']],
        ['test @user_.name', ['@user_.name']],
        ['test @user_.name.', ['@user_.name']],
        ['test@mention', null],
        ['test @mention1 @mention2 mentions', ['@mention1', '@mention2']],
        ['test @mention1 @mention2. Mentions...', ['@mention1', '@mention2']],

        ['where is @jessica.hyde?', ['@jessica.hyde']],
        ['where is @jessica.hyde.', ['@jessica.hyde']],
        ['test @user.name. @user2.name', ['@user.name', '@user2.name']],
        ['test @user.name.@user2.name', ['@user.name', '@user2.name']],

        ['non latin @桜 mention', ['@桜']],
        ['@γεια non latin', ['@γεια']],
        ['non latin @γεια.', ['@γεια']],

        // since word boundaries don't work with non latin characters
        // the following is a known bug
        ['άντε@γεια.com', ['@γεια.com']],
    ])('MENTIONS_REGEX %s => %s', (text, expected) => {
        expect(text.match(MENTIONS_REGEX)).toEqual(expected);
    });
});

// Antimatter: a channel link is typed #channel-name; Mattermost's ~channel-name keeps working.
describe('channel link regular expressions', () => {
    test.each([
        ['see #', '#', ''],
        ['see #town-sq', '#town-sq', 'town-sq'],
        ['#town', '#town', 'town'],
        ['see ~town-sq', '~town-sq', 'town-sq'],
        ['(#town', '#town', 'town'],
        ['#done and #next', '#next', 'next'],
        ['~done and #next', '#next', 'next'],
        ['#done and ~next', '~next', 'next'],
        ['see #town sq', '#town sq', 'town sq'],
    ])('CHANNEL_MENTION_REGEX %j => %j', (text, link, term) => {
        const match = text.match(CHANNEL_MENTION_REGEX);
        expect(match?.[1]).toBe(link);
        expect(match?.[2]).toBe(term);
    });

    test.each([
        ['C#'],
        ['page#anchor'],
        ['3#'],
        ['snake_#'],
        ['#first line\nsecond'],
        ['no link here'],
    ])('CHANNEL_MENTION_REGEX does not match %j', (text) => {
        expect(text.match(CHANNEL_MENTION_REGEX)).toBeNull();
    });

    test('CHANNEL_MENTION_REGEX_DELAYED needs two characters after the sign', () => {
        expect('see #'.match(CHANNEL_MENTION_REGEX_DELAYED)).toBeNull();
        expect('see #t'.match(CHANNEL_MENTION_REGEX_DELAYED)).toBeNull();
        expect('see #to'.match(CHANNEL_MENTION_REGEX_DELAYED)?.[2]).toBe('to');
        expect('see ~to'.match(CHANNEL_MENTION_REGEX_DELAYED)?.[2]).toBe('to');
        expect('C#to'.match(CHANNEL_MENTION_REGEX_DELAYED)).toBeNull();
    });
});
