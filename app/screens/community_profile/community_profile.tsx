// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {Image, Text, View} from 'react-native';

import {buildProfileImageUrlFromUser} from '@actions/remote/user';
import {patchCommunityProfile, resetCommunityProfile, uploadCommunityAvatar} from '@actions/remote/community_profile';
import Button from '@components/button';
import SettingContainer from '@components/settings/container';
import TextSetting from '@components/settings/text_setting';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import NetworkManager from '@managers/network_manager';
import FilePickerUtil from '@utils/file/file_picker';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import type UserModel from '@typings/database/models/servers/user';

type Props = {
    teamId: string;
    communityName?: string;
    currentUser?: UserModel;
    profile?: CommunityProfile;
}

const messages = defineMessages({
    nicknameLabel: {
        id: 'community_profile.nickname.label',
        defaultMessage: 'Nickname',
    },
    nicknamePlaceholder: {
        id: 'community_profile.nickname.placeholder',
        defaultMessage: 'Shown here instead of your global nickname',
    },
    save: {
        id: 'community_profile.save',
        defaultMessage: 'Save',
    },
    changePicture: {
        id: 'community_profile.change_picture',
        defaultMessage: 'Change picture',
    },
    useMyPicture: {
        id: 'community_profile.use_my_picture',
        defaultMessage: 'Use my profile picture',
    },
    description: {
        id: 'community_profile.description',
        defaultMessage: 'Shown instead of your global profile in {communityName}. Direct and group messages keep your global profile.',
    },
});

const AVATAR_SIZE = 96;

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        description: {
            color: changeOpacity(theme.centerChannelColor, 0.64),
            marginBottom: 20,
            ...typography('Body', 100, 'Regular'),
        },
        avatarRow: {
            alignItems: 'center',
            marginBottom: 24,
            gap: 12,
        },
        avatar: {
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
        },
        buttonRow: {
            marginTop: 12,
            gap: 10,
        },
    };
});

const CommunityProfile = ({teamId, communityName, currentUser, profile}: Props) => {
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const intl = useIntl();
    const serverUrl = useServerUrl();

    const [nickname, setNickname] = useState(profile?.nickname ?? '');
    const [saving, setSaving] = useState(false);

    const avatarUrl = useMemo(() => {
        if (!currentUser) {
            return undefined;
        }
        if (profile?.avatar_update_at) {
            const client = NetworkManager.getClient(serverUrl);
            return client.getCommunityAvatarUrl(teamId, currentUser.id, profile.avatar_update_at);
        }
        return buildProfileImageUrlFromUser(serverUrl, currentUser);
    }, [currentUser, profile?.avatar_update_at, serverUrl, teamId]);

    const onChangePicture = useCallback(() => {
        const picker = new FilePickerUtil(intl, async (files) => {
            const localPath = files[0]?.localPath;
            if (localPath) {
                await uploadCommunityAvatar(serverUrl, teamId, localPath);
            }
        });
        picker.attachFileFromPhotoGallery(1);
    }, [intl, serverUrl, teamId]);

    const onUseMyPicture = useCallback(async () => {
        await resetCommunityProfile(serverUrl, teamId, {avatar: true});
    }, [serverUrl, teamId]);

    const onSaveNickname = useCallback(async () => {
        setSaving(true);
        await patchCommunityProfile(serverUrl, teamId, nickname.trim());
        setSaving(false);
    }, [serverUrl, teamId, nickname]);

    const canSave = nickname.trim() !== (profile?.nickname ?? '');

    return (
        <SettingContainer testID='community_profile'>
            <Text style={styles.description}>
                {intl.formatMessage(messages.description, {communityName: communityName || ''})}
            </Text>
            <View style={styles.avatarRow}>
                {avatarUrl && (
                    <Image
                        source={{uri: avatarUrl}}
                        style={styles.avatar}
                        testID='community_profile.avatar'
                    />
                )}
                <Button
                    onPress={onChangePicture}
                    theme={theme}
                    text={intl.formatMessage(messages.changePicture)}
                    emphasis='link'
                    size='m'
                    testID='community_profile.change_picture.button'
                />
                {Boolean(profile?.avatar_update_at) && (
                    <Button
                        onPress={onUseMyPicture}
                        theme={theme}
                        text={intl.formatMessage(messages.useMyPicture)}
                        emphasis='link'
                        size='m'
                        testID='community_profile.use_my_picture.button'
                    />
                )}
            </View>
            <TextSetting
                label={intl.formatMessage(messages.nicknameLabel)}
                placeholder={intl.formatMessage(messages.nicknamePlaceholder)}
                disabled={false}
                optional={true}
                onChange={setNickname}
                value={nickname}
                maxLength={64}
                multiline={false}
                keyboardType='default'
                secureTextEntry={false}
                testID='community_profile.nickname'
                location={Screens.COMMUNITY_PROFILE}
            />
            <View style={styles.buttonRow}>
                <Button
                    onPress={onSaveNickname}
                    theme={theme}
                    text={intl.formatMessage(messages.save)}
                    disabled={!canSave || saving}
                    size='m'
                    testID='community_profile.save.button'
                />
            </View>
        </SettingContainer>
    );
};

export default CommunityProfile;
