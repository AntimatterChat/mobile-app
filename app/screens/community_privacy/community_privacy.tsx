// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo} from 'react';
import {defineMessages, useIntl, type MessageDescriptor} from 'react-intl';
import {Text, View} from 'react-native';

import {DMPrivacy, setCommunityDMPrivacy, setCommunityHiddenFields, type DMPrivacyValue} from '@actions/remote/community_privacy';
import Button from '@components/button';
import OptionItem from '@components/option_item';
import SettingContainer from '@components/settings/container';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {hiddenIn, parseProfilePrivacy, PROFILE_FIELDS, type ProfileField} from '@utils/community_privacy';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import type UserModel from '@typings/database/models/servers/user';

type Props = {
    teamId: string;
    communityName?: string;
    currentUser?: UserModel;
    dmPrivacy?: string;
}

const messages = defineMessages({
    dmTitle: {
        id: 'community_privacy.dm.title',
        defaultMessage: 'Direct messages',
    },
    dmDefault: {
        id: 'community_privacy.dm.default',
        defaultMessage: 'As my default',
    },
    dmEveryone: {
        id: 'community_privacy.dm.everyone',
        defaultMessage: 'Accept from everyone',
    },
    dmAsk: {
        id: 'community_privacy.dm.ask',
        defaultMessage: 'Ask me first',
    },
    dmRefuse: {
        id: 'community_privacy.dm.refuse',
        defaultMessage: 'Refuse',
    },
    profileTitle: {
        id: 'community_privacy.profile.title',
        defaultMessage: 'Your profile',
    },
    profileDescription: {
        id: 'community_privacy.profile.description',
        defaultMessage: 'Which of your details {communityName} sees. Your username and picture always show.',
    },
    useDefaults: {
        id: 'community_privacy.use_defaults',
        defaultMessage: 'Use my defaults',
    },
    fieldFullName: {id: 'community_privacy.field.full_name', defaultMessage: 'Full name'},
    fieldNickname: {id: 'community_privacy.field.nickname', defaultMessage: 'Nickname'},
    fieldPosition: {id: 'community_privacy.field.position', defaultMessage: 'Position'},
    fieldEmail: {id: 'community_privacy.field.email', defaultMessage: 'Email'},
    fieldLocalTime: {id: 'community_privacy.field.local_time', defaultMessage: 'Local time'},
    fieldAttributes: {id: 'community_privacy.field.attributes', defaultMessage: 'Attributes'},
});

const fieldLabel: Record<ProfileField, MessageDescriptor> = {
    full_name: messages.fieldFullName,
    nickname: messages.fieldNickname,
    position: messages.fieldPosition,
    email: messages.fieldEmail,
    local_time: messages.fieldLocalTime,
    attributes: messages.fieldAttributes,
};

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
            marginTop: 12,
        },
    };
});

const CommunityPrivacy = ({teamId, communityName, currentUser, dmPrivacy}: Props) => {
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const intl = useIntl();
    const serverUrl = useServerUrl();

    const privacy = useMemo(() => parseProfilePrivacy(currentUser?.props), [currentUser?.props]);
    const hasOwnChoice = privacy[teamId] !== undefined;
    const hidden = useMemo(() => hiddenIn(privacy, teamId), [privacy, teamId]);

    const onSelectDM = useCallback((value: DMPrivacyValue | null) => {
        setCommunityDMPrivacy(serverUrl, teamId, value);
    }, [serverUrl, teamId]);

    const onToggleField = useCallback((field: ProfileField, show: boolean) => {
        const next = show ? hidden.filter((f) => f !== field) : [...hidden, field];
        setCommunityHiddenFields(serverUrl, teamId, next);
    }, [serverUrl, teamId, hidden]);

    const onUseDefaults = useCallback(() => {
        setCommunityHiddenFields(serverUrl, teamId, null);
    }, [serverUrl, teamId]);

    return (
        <SettingContainer testID='community_privacy'>
            <Text style={styles.sectionTitle}>{intl.formatMessage(messages.dmTitle)}</Text>
            <OptionItem
                type='radio'
                label={intl.formatMessage(messages.dmDefault)}
                selected={!dmPrivacy}
                action={() => onSelectDM(null)}
                testID='community_privacy.dm.default.option'
            />
            <OptionItem
                type='radio'
                label={intl.formatMessage(messages.dmEveryone)}
                selected={dmPrivacy === DMPrivacy.EVERYONE}
                action={() => onSelectDM(DMPrivacy.EVERYONE)}
                testID='community_privacy.dm.everyone.option'
            />
            <OptionItem
                type='radio'
                label={intl.formatMessage(messages.dmAsk)}
                selected={dmPrivacy === DMPrivacy.ASK}
                action={() => onSelectDM(DMPrivacy.ASK)}
                testID='community_privacy.dm.ask.option'
            />
            <OptionItem
                type='radio'
                label={intl.formatMessage(messages.dmRefuse)}
                selected={dmPrivacy === DMPrivacy.REFUSE}
                action={() => onSelectDM(DMPrivacy.REFUSE)}
                testID='community_privacy.dm.refuse.option'
            />

            <Text style={styles.sectionTitle}>{intl.formatMessage(messages.profileTitle)}</Text>
            <Text style={styles.description}>
                {intl.formatMessage(messages.profileDescription, {communityName: communityName || ''})}
            </Text>
            {PROFILE_FIELDS.map((field) => (
                <OptionItem
                    key={field}
                    type='toggle'
                    label={intl.formatMessage(fieldLabel[field])}
                    selected={!hidden.includes(field)}
                    action={(value: string | boolean) => onToggleField(field, Boolean(value))}
                    testID={`community_privacy.field.${field}.option`}
                />
            ))}
            {hasOwnChoice && (
                <View style={styles.buttonRow}>
                    <Button
                        onPress={onUseDefaults}
                        theme={theme}
                        text={intl.formatMessage(messages.useDefaults)}
                        emphasis='link'
                        size='m'
                        testID='community_privacy.use_defaults.button'
                    />
                </View>
            )}
        </SettingContainer>
    );
};

export default CommunityPrivacy;
