// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {CHANNEL_MENTION_REGEX_DELAYED} from '@constants/autocomplete';

import {completeChannelMention, getChannelMentionMatch, stripChannelSign} from './channel_link';

// Antimatter: a channel link is typed #channel-name, as in Fusion; Mattermost's ~channel-name keeps working.
describe('getChannelMentionMatch', () => {
    test.each([
        ['see #', {sign: '#', term: ''}],
        ['see #Town-Sq', {sign: '#', term: 'town-sq'}],
        ['#town', {sign: '#', term: 'town'}],
        ['see ~town', {sign: '~', term: 'town'}],
        ['#~town', {sign: '~', term: 'town'}],
        ['see #town sq', {sign: '#', term: 'town sq'}],
    ])('%j is a channel link being typed', (text, expected) => {
        expect(getChannelMentionMatch(text)).toEqual(expected);
    });

    test.each([
        ['# Title', 'a heading'],
        ['## Title', 'a heading'],
        ['##town', 'two signs in a row'],
        ['~~town', 'two signs in a row (what completing leaves on iOS for a moment)'],
        ['it&#39', 'an HTML entity'],
        ['C#', 'a # after a letter'],
        ['page#anchor', 'a # after a letter'],
        ['no link', 'no sign'],
    ])('%j is not a channel link: %s', (text) => {
        expect(getChannelMentionMatch(text)).toBeNull();
    });

    test('with the delayed pattern, waits for two characters', () => {
        expect(getChannelMentionMatch('see #t', CHANNEL_MENTION_REGEX_DELAYED)).toBeNull();
        expect(getChannelMentionMatch('see #to', CHANNEL_MENTION_REGEX_DELAYED)).toEqual({sign: '#', term: 'to'});
        expect(getChannelMentionMatch('# Ti', CHANNEL_MENTION_REGEX_DELAYED)).toBeNull();
    });
});

describe('completeChannelMention', () => {
    test('completes a # link as #channel-name', () => {
        expect(completeChannelMention('see #gen', 'general')).toBe('see #general ');
    });

    test('completes a ~ link as #channel-name too', () => {
        expect(completeChannelMention('see ~gen', 'general')).toBe('see #general ');
    });

    test('only replaces the link being typed', () => {
        expect(completeChannelMention('#off-topic and #ge', 'general')).toBe('#off-topic and #general ');
    });

    test('doubles the sign for iOS', () => {
        expect(completeChannelMention('see #gen', 'general', true)).toBe('see ##general ');
    });
});

describe('stripChannelSign', () => {
    test.each([
        ['#general', 'general'],
        ['~general', 'general'],
        ['general', 'general'],
        ['', ''],
    ])('%j => %j', (name, expected) => {
        expect(stripChannelSign(name)).toBe(expected);
    });
});
