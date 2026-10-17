// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Text} from 'react-native';

import {joinChannel, switchToChannelById} from '@actions/remote/channel';
import {fireEvent, renderWithIntl, screen, waitFor} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import ChannelMention, {getChannelFromChannelName, type ChannelMentions} from './channel_mention';

jest.mock('@actions/remote/channel', () => ({
    joinChannel: jest.fn(),
    switchToChannelById: jest.fn(),
}));

jest.mock('@context/server', () => ({
    useServerUrl: () => 'http://localhost:8065',
}));

// Antimatter shows every channel link as #Channel Name, whether it was written #channel-name or ~channel-name.
describe('ChannelMention', () => {
    const townSquare = TestHelper.fakeChannelModel({id: 'town-id', name: 'town-square', displayName: 'Town Square'});
    const team = TestHelper.fakeTeamModel({id: 'team-id', name: 'myteam'});
    const baseProps = {
        channels: [townSquare],
        currentTeamId: 'team-id',
        linkStyle: {color: 'blue'},
        team,
        textStyle: {color: 'black'},
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should show an old ~ link as #', () => {
        renderWithIntl(
            <ChannelMention
                {...baseProps}
                channelName='town-square'
            />,
        );

        expect(screen.getByText('#Town Square')).toBeTruthy();
        expect(screen.queryByText('~Town Square')).toBeNull();
    });

    it('should show a # link as #, and open its channel', async () => {
        renderWithIntl(
            <ChannelMention
                {...baseProps}
                channelName='town-square'
                sigil='#'
            />,
        );

        fireEvent.press(screen.getByText('#Town Square'));
        await waitFor(() => expect(switchToChannelById).toHaveBeenCalledWith('http://localhost:8065', 'town-id'));
    });

    it('should keep trailing punctuation out of the link', () => {
        renderWithIntl(
            <ChannelMention
                {...baseProps}
                channelName='town-square-'
                sigil='#'
            />,
        );

        expect(screen.getByText('#Town Square')).toBeTruthy();
        expect(screen.getByText('#Town Square-')).toBeTruthy();
    });

    it('should link a channel the server resolved, and join it by its name', async () => {
        const channelMentions: ChannelMentions = {'off-topic': {display_name: 'Off-Topic', team_name: 'otherteam'}};
        jest.mocked(joinChannel).mockResolvedValue({channel: {id: 'off-id', name: 'off-topic'}} as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        renderWithIntl(
            <ChannelMention
                {...baseProps}
                channelMentions={channelMentions}
                channelName='off-topic_'
                sigil='#'
            />,
        );

        fireEvent.press(screen.getByText('#Off-Topic'));
        await waitFor(() => expect(joinChannel).toHaveBeenCalledWith('http://localhost:8065', 'team-id', undefined, 'off-topic'));
        await waitFor(() => expect(switchToChannelById).toHaveBeenCalledWith('http://localhost:8065', 'off-id'));
    });

    it('should show an unknown ~name as written', () => {
        renderWithIntl(
            <ChannelMention
                {...baseProps}
                channelName='5'
            />,
        );

        expect(screen.getByText('~5')).toBeTruthy();
    });

    it('should show an unknown #name as written, or as what it is instead', () => {
        const {rerender} = renderWithIntl(
            <ChannelMention
                {...baseProps}
                channelName='qa'
                sigil='#'
            />,
        );
        expect(screen.getByText('#qa')).toBeTruthy();

        rerender(
            <ChannelMention
                {...baseProps}
                channelName='release'
                sigil='#'
                unresolved={<Text testID='hashtag'>{'#release'}</Text>}
            />,
        );
        expect(screen.getByTestId('hashtag')).toBeTruthy();
    });
});

describe('getChannelFromChannelName', () => {
    const townSquare = TestHelper.fakeChannelModel({id: 'town-id', name: 'town-square', displayName: 'Town Square'});

    it('should find a channel whatever the case it was written in', () => {
        expect(getChannelFromChannelName('Town-Square', [townSquare], {}, 'myteam')).toEqual({
            channel: {id: 'town-id', display_name: 'Town Square', name: 'town-square', team_name: 'myteam'},
            matched: 'Town-Square',
        });
    });

    it('should not change the post\'s channel_mentions', () => {
        const channelMentions: ChannelMentions = {'off-topic': {display_name: 'Off-Topic'}};
        getChannelFromChannelName('town-square', [townSquare], channelMentions, 'myteam');
        expect(Object.keys(channelMentions)).toEqual(['off-topic']);
    });

    it('should find nothing for a name no channel has', () => {
        expect(getChannelFromChannelName('release', [townSquare], {}, 'myteam')).toBeNull();
    });
});
