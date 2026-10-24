// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {useIntl} from 'react-intl';

import SlideUpPanelItem from '@components/slide_up_panel_item';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {dismissBottomSheet, navigateToScreen} from '@screens/navigation';
import {confirmLeaveTeam, openJoinTeamModal} from '@utils/team_menu';

type Props = {
    canJoinOtherTeams: boolean;
    hasMoreThanOneTeam: boolean;
    currentTeamId: string;
    currentTeamDisplayName: string;
}

const TeamMenu = ({canJoinOtherTeams, hasMoreThanOneTeam, currentTeamId, currentTeamDisplayName}: Props) => {
    const intl = useIntl();
    const serverUrl = useServerUrl();

    const onJoinAnotherTeam = useCallback(async () => {
        await dismissBottomSheet();
        openJoinTeamModal();
    }, []);

    const onLeaveTeam = useCallback(async () => {
        await dismissBottomSheet();
        confirmLeaveTeam(intl, serverUrl, currentTeamId, currentTeamDisplayName);
    }, [intl, serverUrl, currentTeamId, currentTeamDisplayName]);

    const onYourProfile = useCallback(async () => {
        await dismissBottomSheet();
        navigateToScreen(Screens.COMMUNITY_PROFILE, {teamId: currentTeamId, communityName: currentTeamDisplayName});
    }, [currentTeamId, currentTeamDisplayName]);

    const onPrivacySettings = useCallback(async () => {
        await dismissBottomSheet();
        navigateToScreen(Screens.COMMUNITY_PRIVACY, {teamId: currentTeamId});
    }, [currentTeamId]);

    const onNotificationSettings = useCallback(async () => {
        await dismissBottomSheet();
        navigateToScreen(Screens.COMMUNITY_NOTIFICATIONS, {teamId: currentTeamId});
    }, [currentTeamId]);

    return (
        <>
            <SlideUpPanelItem
                leftIcon='account-outline'
                onPress={onYourProfile}
                testID='team_menu.your_profile'
                text={intl.formatMessage({id: 'mobile.team_menu.your_profile', defaultMessage: 'Your profile in this community…'})}
            />
            <SlideUpPanelItem
                leftIcon='shield-outline'
                onPress={onPrivacySettings}
                testID='team_menu.privacy_settings'
                text={intl.formatMessage({id: 'mobile.team_menu.privacy_settings', defaultMessage: 'Privacy settings…'})}
            />
            <SlideUpPanelItem
                leftIcon='bell-outline'
                onPress={onNotificationSettings}
                testID='team_menu.notification_settings'
                text={intl.formatMessage({id: 'mobile.team_menu.notification_settings', defaultMessage: 'Notification settings…'})}
            />
            {canJoinOtherTeams && (
                <SlideUpPanelItem
                    leftIcon='account-multiple-plus-outline'
                    onPress={onJoinAnotherTeam}
                    testID='team_menu.join_another_team'
                    text={intl.formatMessage({id: 'mobile.add_team.join_team', defaultMessage: 'Join Another Community'})}
                />
            )}
            {hasMoreThanOneTeam && (
                <SlideUpPanelItem
                    destructive={true}
                    leftIcon='exit-to-app'
                    onPress={onLeaveTeam}
                    testID='team_menu.leave_team'
                    text={intl.formatMessage({id: 'mobile.team_menu.leave_team', defaultMessage: 'Leave community'})}
                />
            )}
        </>
    );
};

export default TeamMenu;
