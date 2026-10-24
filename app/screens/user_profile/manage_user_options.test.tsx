// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {Members} from '@constants';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import ManageUserOptions from './manage_user_options';

jest.mock('@components/channel_actions/manage_members_label', () => {
    const {Text} = require('react-native');
    function MockManageMembersLabel(props: {manageOption: string; testID: string}) {
        return <Text testID={`${props.testID}.${props.manageOption}`}/>;
    }
    return MockManageMembersLabel;
});

const {RESET_NICKNAME, RESET_AVATAR} = Members.ManageOptions;

function getBaseProps() {
    return {
        channelId: 'channel1',
        isDefaultChannel: false,
        isChannelAdmin: false,
        canChangeMemberRoles: false,
        userId: 'user1',
    };
}

describe('ManageUserOptions community profile resets', () => {
    it('should show neither reset row without canResetCommunityProfile', () => {
        const {queryByTestId} = renderWithIntlAndTheme(
            <ManageUserOptions
                {...getBaseProps()}
                canResetCommunityProfile={false}
                teamId='team1'
                hasCommunityNickname={true}
                hasCommunityAvatar={true}
            />,
        );

        expect(queryByTestId(`channel.reset_community_nickname.${RESET_NICKNAME}`)).toBeNull();
        expect(queryByTestId(`channel.reset_community_avatar.${RESET_AVATAR}`)).toBeNull();
    });

    it('should show only the rows for what the member actually has set, to a moderator', () => {
        const {queryByTestId} = renderWithIntlAndTheme(
            <ManageUserOptions
                {...getBaseProps()}
                canResetCommunityProfile={true}
                teamId='team1'
                hasCommunityNickname={true}
                hasCommunityAvatar={false}
            />,
        );

        expect(queryByTestId(`channel.reset_community_nickname.${RESET_NICKNAME}`)).toBeTruthy();
        expect(queryByTestId(`channel.reset_community_avatar.${RESET_AVATAR}`)).toBeNull();
    });

    it('should show neither row without a teamId', () => {
        const {queryByTestId} = renderWithIntlAndTheme(
            <ManageUserOptions
                {...getBaseProps()}
                canResetCommunityProfile={true}
                hasCommunityNickname={true}
                hasCommunityAvatar={true}
            />,
        );

        expect(queryByTestId(`channel.reset_community_nickname.${RESET_NICKNAME}`)).toBeNull();
        expect(queryByTestId(`channel.reset_community_avatar.${RESET_AVATAR}`)).toBeNull();
    });
});
