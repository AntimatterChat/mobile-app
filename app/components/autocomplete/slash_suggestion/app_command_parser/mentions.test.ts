// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {searchChannels} from '@actions/remote/channel';
import TestHelper from '@test/test_helper';

import {getChannelSuggestions, inTextMentionSuggestions} from './mentions';

jest.mock('@actions/remote/channel', () => ({
    searchChannels: jest.fn(),
}));

jest.mock('@actions/remote/user', () => ({
    searchUsers: jest.fn(),
}));

// Antimatter: slash commands take channels as #channel-name; ~channel-name keeps working, and completes as typed.
describe('slash command channel mentions', () => {
    const townSquare = TestHelper.fakeChannel({id: 'town-id', name: 'general', display_name: 'General'});

    beforeEach(() => {
        jest.mocked(searchChannels).mockReset();
        jest.mocked(searchChannels).mockResolvedValue({channels: [townSquare]});
    });

    test('suggests channels as #channel-name, or ~channel-name when asked', async () => {
        expect((await getChannelSuggestions([townSquare])).map((s) => s.Complete)).toEqual(['#general']);
        expect((await getChannelSuggestions([townSquare], '~')).map((s) => s.Complete)).toEqual(['~general']);
    });

    test('completes a channel typed with #', async () => {
        const suggestions = await inTextMentionSuggestions('http://server', 'hello #town', 'channel-id', 'team-id');
        expect(searchChannels).toHaveBeenCalledWith('http://server', 'town', 'team-id');
        expect(suggestions?.map((s) => s.Complete)).toEqual(['hello #general']);
    });

    test('completes a channel typed with ~ as ~channel-name', async () => {
        const suggestions = await inTextMentionSuggestions('http://server', 'hello ~town', 'channel-id', 'team-id');
        expect(searchChannels).toHaveBeenCalledWith('http://server', 'town', 'team-id');
        expect(suggestions?.map((s) => s.Complete)).toEqual(['hello ~general']);
    });

    test('leaves ## and ~~ alone', async () => {
        expect(await inTextMentionSuggestions('http://server', 'hello ##town', 'channel-id', 'team-id')).toBeNull();
        expect(await inTextMentionSuggestions('http://server', 'hello ~~town', 'channel-id', 'team-id')).toBeNull();
        expect(searchChannels).not.toHaveBeenCalled();
    });
});
