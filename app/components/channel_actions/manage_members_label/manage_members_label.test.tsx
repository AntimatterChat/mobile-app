// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, fireEvent} from '@testing-library/react-native';
import React from 'react';
import {Alert} from 'react-native';

import {resetCommunityProfile} from '@actions/remote/community_profile';
import {Members} from '@constants';
import {dismissBottomSheet} from '@screens/navigation';
import {renderWithIntl} from '@test/intl-test-helper';

import ManageMembersLabel from './manage_members_label';

jest.mock('@actions/remote/channel', () => ({
    fetchChannelStats: jest.fn(),
    removeMemberFromChannel: jest.fn(),
    updateChannelMemberSchemeRoles: jest.fn(),
}));
jest.mock('@actions/remote/community_profile', () => ({
    resetCommunityProfile: jest.fn().mockResolvedValue({}),
}));
jest.mock('@screens/navigation', () => ({
    dismissBottomSheet: jest.fn().mockResolvedValue(undefined),
}));

const {RESET_NICKNAME, RESET_AVATAR} = Members.ManageOptions;

describe('ManageMembersLabel resets', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should reset the member's community nickname once confirmed", async () => {
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        const {getByTestId} = renderWithIntl(
            <ManageMembersLabel
                canRemoveUser={false}
                channelId='channel1'
                manageOption={RESET_NICKNAME}
                teamId='team1'
                testID='reset_nickname'
                userId='user1'
            />,
        );

        fireEvent.press(getByTestId('reset_nickname'));
        expect(alert).toHaveBeenCalledWith('Reset nickname', expect.any(String), expect.any(Array), expect.anything());

        const buttons = alert.mock.lastCall![2]!;
        await act(async () => {
            await buttons[1].onPress!();
        });

        expect(resetCommunityProfile).toHaveBeenCalledWith('', 'team1', {nickname: true});
        expect(dismissBottomSheet).toHaveBeenCalled();
    });

    it("should reset the member's community picture once confirmed", async () => {
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        const {getByTestId} = renderWithIntl(
            <ManageMembersLabel
                canRemoveUser={false}
                channelId='channel1'
                manageOption={RESET_AVATAR}
                teamId='team1'
                testID='reset_avatar'
                userId='user1'
            />,
        );

        fireEvent.press(getByTestId('reset_avatar'));
        const buttons = alert.mock.lastCall![2]!;
        await act(async () => {
            await buttons[1].onPress!();
        });

        expect(resetCommunityProfile).toHaveBeenCalledWith('', 'team1', {avatar: true});
    });

    it('should not call the server without a teamId', async () => {
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        const {getByTestId} = renderWithIntl(
            <ManageMembersLabel
                canRemoveUser={false}
                channelId='channel1'
                manageOption={RESET_NICKNAME}
                testID='reset_nickname'
                userId='user1'
            />,
        );

        fireEvent.press(getByTestId('reset_nickname'));
        const buttons = alert.mock.lastCall![2]!;
        await act(async () => {
            await buttons[1].onPress!();
        });

        expect(resetCommunityProfile).not.toHaveBeenCalled();
        expect(dismissBottomSheet).toHaveBeenCalled();
    });
});
