// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import {View} from 'react-native';

import ManageMembersLabel from '@components/channel_actions/manage_members_label';
import {Members} from '@constants';
import {useTheme} from '@context/theme';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

export const DIVIDER_MARGIN = 8;
const {MAKE_CHANNEL_ADMIN, MAKE_CHANNEL_MEMBER, REMOVE_USER, RESET_NICKNAME, RESET_AVATAR} = Members.ManageOptions;

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        divider: {
            alignSelf: 'center',
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.16),
            height: 1,
            marginVertical: DIVIDER_MARGIN,
            paddingHorizontal: 20,
            width: '100%',
        },
    };
});

type Props = {
    channelId: string;
    isDefaultChannel: boolean;
    isChannelAdmin: boolean;
    canChangeMemberRoles: boolean;
    userId: string;

    // teamId, hasCommunityNickname and hasCommunityAvatar are only for the Reset nickname/picture rows: the
    // member's own community profile, shown only when they have actually set one there. canResetCommunityProfile
    // is its own, community-wide permission (the server's CheckCanModerateMember: manage_team or
    // remove_user_from_team) - distinct from the parent's channel-scoped canManageAndRemoveMembers, which this
    // component doesn't otherwise need.
    teamId?: string;
    hasCommunityNickname?: boolean;
    hasCommunityAvatar?: boolean;
    canResetCommunityProfile?: boolean;
}

const ManageUserOptions = ({
    channelId, isChannelAdmin, isDefaultChannel, userId, canChangeMemberRoles,
    teamId, hasCommunityNickname, hasCommunityAvatar, canResetCommunityProfile,
}: Props) => {
    const theme = useTheme();
    const styles = getStyleSheet(theme);

    return (
        <>
            <View style={styles.divider}/>
            {canChangeMemberRoles &&
                <ManageMembersLabel
                    channelId={channelId}
                    isDefaultChannel={isDefaultChannel}
                    manageOption={isChannelAdmin ? MAKE_CHANNEL_MEMBER : MAKE_CHANNEL_ADMIN}
                    testID='channel.make_channel_admin'
                    userId={userId}
                />
            }
            <ManageMembersLabel
                channelId={channelId}
                isDefaultChannel={isDefaultChannel}
                manageOption={REMOVE_USER}
                testID='channel.remove_member'
                userId={userId}
            />
            {canResetCommunityProfile && teamId && hasCommunityNickname &&
                <ManageMembersLabel
                    channelId={channelId}
                    manageOption={RESET_NICKNAME}
                    teamId={teamId}
                    testID='channel.reset_community_nickname'
                    userId={userId}
                />
            }
            {canResetCommunityProfile && teamId && hasCommunityAvatar &&
                <ManageMembersLabel
                    channelId={channelId}
                    manageOption={RESET_AVATAR}
                    teamId={teamId}
                    testID='channel.reset_community_avatar'
                    userId={userId}
                />
            }
        </>
    );
};

export default ManageUserOptions;
