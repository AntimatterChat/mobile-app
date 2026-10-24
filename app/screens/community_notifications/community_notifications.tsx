// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {Text, View} from 'react-native';

import {resetCommunityNotifyProps, setCommunityNotifyProp} from '@actions/remote/community_notifications';
import Button from '@components/button';
import OptionItem from '@components/option_item';
import SettingContainer from '@components/settings/container';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {isCommunityNotifyEmpty, type CommunityNotifyKey, type CommunityNotifyProps} from '@utils/community_notify';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

type Props = {
    teamId: string;
    communityName?: string;
    notifyProps: CommunityNotifyProps;
}

const messages = defineMessages({
    desktopTitle: {id: 'community_notifications.desktop.title', defaultMessage: 'Desktop and browser'},
    mobileTitle: {id: 'community_notifications.mobile.title', defaultMessage: 'Mobile'},
    emailTitle: {id: 'community_notifications.email.title', defaultMessage: 'Email'},
    mentionsTitle: {id: 'community_notifications.mentions.title', defaultMessage: 'What counts as a mention'},
    mentionsDescription: {id: 'community_notifications.mentions.description', defaultMessage: 'Channel-wide mentions (@channel, @here, @all) in {communityName}'},
    asInMySettings: {id: 'community_notifications.as_in_my_settings', defaultMessage: 'As in my settings'},
    all: {id: 'community_notifications.all', defaultMessage: 'All new messages'},
    mention: {id: 'community_notifications.mention', defaultMessage: 'Mentions only'},
    none: {id: 'community_notifications.none', defaultMessage: 'Nothing'},
    on: {id: 'community_notifications.on', defaultMessage: 'On'},
    off: {id: 'community_notifications.off', defaultMessage: 'Off'},
    useMySettingsEverywhere: {id: 'community_notifications.use_my_settings_everywhere', defaultMessage: 'Use my settings everywhere'},
});

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        sectionTitle: {
            color: changeOpacity(theme.centerChannelColor, 0.64),
            marginTop: 20,
            marginBottom: 4,
            ...typography('Heading', 75, 'SemiBold'),
        },
        description: {
            color: changeOpacity(theme.centerChannelColor, 0.64),
            marginBottom: 8,
            ...typography('Body', 75, 'Regular'),
        },
        buttonRow: {
            marginTop: 20,
        },
    };
});

const LevelRow = ({
    communityId,
    propKey,
    value,
    testIDPrefix,
}: {communityId: string; propKey: CommunityNotifyKey; value?: string; testIDPrefix: string}) => {
    const intl = useIntl();
    const serverUrl = useServerUrl();

    const onSelect = useCallback((next: string) => {
        setCommunityNotifyProp(serverUrl, communityId, propKey, next);
    }, [serverUrl, communityId, propKey]);

    const options: Array<{value: string; label: string}> = [
        {value: '', label: intl.formatMessage(messages.asInMySettings)},
        {value: 'all', label: intl.formatMessage(messages.all)},
        {value: 'mention', label: intl.formatMessage(messages.mention)},
        {value: 'none', label: intl.formatMessage(messages.none)},
    ];

    return (
        <>
            {options.map((option) => (
                <OptionItem
                    key={option.value}
                    type='radio'
                    label={option.label}
                    selected={(value ?? '') === option.value}
                    action={() => onSelect(option.value)}
                    testID={`${testIDPrefix}.${option.value || 'as_in_my_settings'}.option`}
                />
            ))}
        </>
    );
};

const OnOffRow = ({
    communityId,
    propKey,
    value,
    testIDPrefix,
}: {communityId: string; propKey: CommunityNotifyKey; value?: string; testIDPrefix: string}) => {
    const intl = useIntl();
    const serverUrl = useServerUrl();

    const onSelect = useCallback((next: string) => {
        setCommunityNotifyProp(serverUrl, communityId, propKey, next);
    }, [serverUrl, communityId, propKey]);

    const options: Array<{value: string; label: string}> = [
        {value: '', label: intl.formatMessage(messages.asInMySettings)},
        {value: 'true', label: intl.formatMessage(messages.on)},
        {value: 'false', label: intl.formatMessage(messages.off)},
    ];

    return (
        <>
            {options.map((option) => (
                <OptionItem
                    key={option.value}
                    type='radio'
                    label={option.label}
                    selected={(value ?? '') === option.value}
                    action={() => onSelect(option.value)}
                    testID={`${testIDPrefix}.${option.value || 'as_in_my_settings'}.option`}
                />
            ))}
        </>
    );
};

const CommunityNotifications = ({teamId, communityName, notifyProps}: Props) => {
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const intl = useIntl();
    const serverUrl = useServerUrl();

    const onUseMySettingsEverywhere = useCallback(() => {
        resetCommunityNotifyProps(serverUrl, teamId);
    }, [serverUrl, teamId]);

    return (
        <SettingContainer testID='community_notifications'>
            <Text style={styles.sectionTitle}>{intl.formatMessage(messages.desktopTitle)}</Text>
            <LevelRow communityId={teamId} propKey='desktop' value={notifyProps.desktop} testIDPrefix='community_notifications.desktop'/>

            <Text style={styles.sectionTitle}>{intl.formatMessage(messages.mobileTitle)}</Text>
            <LevelRow communityId={teamId} propKey='push' value={notifyProps.push} testIDPrefix='community_notifications.mobile'/>

            <Text style={styles.sectionTitle}>{intl.formatMessage(messages.emailTitle)}</Text>
            <OnOffRow communityId={teamId} propKey='email' value={notifyProps.email} testIDPrefix='community_notifications.email'/>

            <Text style={styles.sectionTitle}>{intl.formatMessage(messages.mentionsTitle)}</Text>
            <Text style={styles.description}>
                {intl.formatMessage(messages.mentionsDescription, {communityName: communityName || ''})}
            </Text>
            <OnOffRow communityId={teamId} propKey='channel' value={notifyProps.channel} testIDPrefix='community_notifications.mentions'/>

            {!isCommunityNotifyEmpty(notifyProps) && (
                <View style={styles.buttonRow}>
                    <Button
                        onPress={onUseMySettingsEverywhere}
                        theme={theme}
                        text={intl.formatMessage(messages.useMySettingsEverywhere)}
                        emphasis='link'
                        size='m'
                        testID='community_notifications.use_my_settings_everywhere.button'
                    />
                </View>
            )}
        </SettingContainer>
    );
};

export default CommunityNotifications;
