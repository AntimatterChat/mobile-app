// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, fireEvent, screen} from '@testing-library/react-native';
import React from 'react';

import {createDirectChannel, fetchChannelById, switchToChannelById} from '@actions/remote/channel';
import {fetchMissingProfilesByIds} from '@actions/remote/user';
import {dismissBottomSheet} from '@screens/navigation';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import CommunityTeam from './community_team';

import type ChannelModel from '@typings/database/models/servers/channel';
import type {CommunityGroup} from '@utils/community_groups';

jest.mock('@actions/remote/channel');
jest.mock('@actions/remote/user');
jest.mock('@screens/navigation');
jest.mock('@components/profile_picture', () => () => null);

describe('CommunityTeam', () => {
    const lead = TestHelper.fakeUserModel({id: 'lead', firstName: 'Maya', username: 'maya'});
    const team: CommunityGroup = {
        id: 'team',
        name: 'beta-squad',
        display_name: 'Beta squad',
        description: 'Testing the early builds',
        source: 'custom',
        delete_at: 0,
        team_id: 'community',
        is_team: true,
        tag: 'BETA',
        lead_id: 'lead',
        channel_id: 'channel',
        member_ids: ['lead', 'u2', 'u3'],
    };

    beforeEach(() => {
        jest.mocked(fetchChannelById).mockResolvedValue({error: new Error('forbidden')});
        jest.mocked(dismissBottomSheet).mockResolvedValue();
    });

    it('should show the team, its lead, members and channel, and jump to the channel', async () => {
        const channel = {id: 'channel', displayName: 'beta-squad', teamId: 'community'} as ChannelModel;
        renderWithIntlAndTheme(
            <CommunityTeam
                team={team}
                lead={lead}
                members={[lead]}
                channel={channel}
                isChannelMember={true}
                teammateNameDisplay='username'
            />,
        );

        expect(screen.getByText('BETA')).toBeVisible();
        expect(screen.getByText('Beta squad')).toBeVisible();
        expect(screen.getByText('@beta-squad')).toBeVisible();
        expect(screen.getByText('3 members')).toBeVisible();
        expect(screen.getByText('Lead: maya')).toBeVisible();
        expect(screen.getByText('Channel: #beta-squad')).toBeVisible();
        expect(fetchMissingProfilesByIds).toHaveBeenCalledWith(expect.any(String), ['lead', 'u2', 'u3', 'lead']);
        expect(fetchChannelById).not.toHaveBeenCalled();

        await act(async () => {
            fireEvent.press(screen.getByText('Jump to #beta-squad'));
        });
        expect(switchToChannelById).toHaveBeenCalledWith(expect.any(String), 'channel', 'community');
    });

    it('should offer the lead when the team channel can\'t be seen', async () => {
        jest.mocked(createDirectChannel).mockResolvedValue({data: {id: 'dm'} as Channel});
        renderWithIntlAndTheme(
            <CommunityTeam
                team={team}
                lead={lead}
                members={[]}
                isChannelMember={false}
                teammateNameDisplay='username'
            />,
        );

        await act(async () => {
            await Promise.resolve();
        });
        expect(fetchChannelById).toHaveBeenCalledWith(expect.any(String), 'channel');
        expect(screen.getByText('No team channel yet')).toBeVisible();

        await act(async () => {
            fireEvent.press(screen.getByText('Message Maya, the lead'));
        });
        expect(createDirectChannel).toHaveBeenCalledWith(expect.any(String), 'lead');
        expect(switchToChannelById).toHaveBeenCalledWith(expect.any(String), 'dm');
    });
});
