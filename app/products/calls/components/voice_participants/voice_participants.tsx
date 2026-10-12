// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';
import {Text, View} from 'react-native';

import HeadphonesIcon from '@calls/components/headphones_icon';
import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import ProfilePicture from '@components/profile_picture';
import {HOME_PADDING} from '@constants/view';
import {useTheme} from '@context/theme';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';
import {displayUsername} from '@utils/user';

import type {VoiceParticipant} from './participants';
import type UserModel from '@typings/database/models/servers/user';

type Props = {
    channelId: string;
    participants: VoiceParticipant[];
    users: UserModel[];
    teammateNameDisplay: string;
}

const AVATAR_SIZE = 20;
const ICON_SIZE = 14;

// Under the channel's name: the channel icon (24) and its margin (12).
const INDENT = HOME_PADDING.paddingLeft + 36;

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        paddingLeft: INDENT,
        paddingRight: HOME_PADDING.paddingRight,
        paddingBottom: 4,
        gap: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 26,
    },
    avatar: {
        borderRadius: (AVATAR_SIZE + 4) / 2,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    speaking: {
        borderColor: theme.onlineIndicator,
    },
    name: {
        flex: 1,
        color: changeOpacity(theme.sidebarText, 0.72),
        ...typography('Body', 75),
    },
    live: {
        color: theme.buttonColor,
        backgroundColor: theme.dndIndicator,
        borderRadius: 4,
        paddingHorizontal: 4,
        overflow: 'hidden',
        ...typography('Body', 25, 'SemiBold'),
    },
    icon: {
        color: changeOpacity(theme.sidebarText, 0.56),
    },
}));

// VoiceParticipants lists the people in a voice channel's call under the channel in the channel list, as the web
// app does: who speaks, shares their screen, raised their hand, and who is muted or deafened.
const VoiceParticipants = ({channelId, participants, users, teammateNameDisplay}: Props) => {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const byId = new Map(users.map((u) => [u.id, u]));
    const iconColor = changeOpacity(theme.sidebarText, 0.56);

    return (
        <View
            style={styles.container}
            testID={`voice_participants.${channelId}`}
        >
            {participants.map((p) => {
                const user = byId.get(p.userId);
                let audio = null;
                if (p.deafened) {
                    audio = (
                        <HeadphonesIcon
                            deafened={true}
                            size={ICON_SIZE}
                            color={iconColor}
                            testID={`voice_participants.${p.sessionId}.deafened`}
                        />
                    );
                } else if (p.muted) {
                    audio = (
                        <CompassIcon
                            name='microphone-off'
                            size={ICON_SIZE}
                            style={styles.icon}
                            testID={`voice_participants.${p.sessionId}.muted`}
                        />
                    );
                }
                return (
                    <View
                        key={p.sessionId}
                        style={styles.row}
                        testID={`voice_participants.${p.sessionId}`}
                    >
                        <View style={[styles.avatar, p.speaking && styles.speaking]}>
                            <ProfilePicture
                                author={user}
                                size={AVATAR_SIZE}
                                showStatus={false}
                            />
                        </View>
                        <Text
                            style={styles.name}
                            numberOfLines={1}
                        >
                            {user ? displayUsername(user, intl.locale, teammateNameDisplay) : ''}
                        </Text>
                        {p.screenSharing && (
                            <FormattedText
                                id='mobile.calls_voice_live'
                                defaultMessage='LIVE'
                                style={styles.live}
                            />
                        )}
                        {p.raisedHand && (
                            <CompassIcon
                                name='hand-right'
                                size={ICON_SIZE}
                                color={theme.awayIndicator}
                                testID={`voice_participants.${p.sessionId}.hand`}
                            />
                        )}
                        {audio}
                    </View>
                );
            })}
        </View>
    );
};

export default VoiceParticipants;
