// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react';
import {useIntl} from 'react-intl';
import {Text, TouchableOpacity, View} from 'react-native';

import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {useTheme} from '@context/theme';
import {describeDevice, MAX_SHOWN_SIGN_INS} from '@utils/sign_in';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        marginHorizontal: 8,
        marginBottom: 8,
    },
    card: {
        backgroundColor: theme.centerChannelBg,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.16),
        padding: 12,
        marginBottom: 8,
    },
    top: {
        flexDirection: 'row',
        gap: 10,
    },
    grow: {
        flex: 1,
    },
    title: {
        color: theme.centerChannelColor,
        ...typography('Body', 200, 'SemiBold'),
    },
    sub: {
        color: changeOpacity(theme.centerChannelColor, 0.72),
        ...typography('Body', 75, 'Regular'),
        marginTop: 2,
    },
    hint: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75, 'Regular'),
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 4,
        alignItems: 'center',
    },
    itsMeButton: {
        backgroundColor: changeOpacity(theme.buttonBg, 0.08),
    },
    itsMeText: {
        color: theme.buttonBg,
        ...typography('Body', 100, 'SemiBold'),
    },
    disconnectButton: {
        backgroundColor: theme.errorTextColor,
    },
    disconnectText: {
        color: theme.sidebarHeaderTextColor,
        ...typography('Body', 100, 'SemiBold'),
    },
    more: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75, 'Regular'),
        textAlign: 'center',
    },
}));

function SignInCard({signIn, onItsMe, onDisconnect}: {signIn: SignIn; onItsMe: () => void; onDisconnect: () => Promise<boolean>}) {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const [busy, setBusy] = useState(false);
    const device = describeDevice(intl, signIn);
    const time = intl.formatTime(signIn.create_at);

    return (
        <View
            style={styles.card}
            testID={`sign_in_warning.card.${signIn.session_id}`}
        >
            <View style={styles.top}>
                <CompassIcon
                    name='shield-outline'
                    size={20}
                    color={theme.centerChannelColor}
                />
                <View style={styles.grow}>
                    <Text style={styles.title}>
                        {intl.formatMessage({id: 'sign_in_warning.title', defaultMessage: 'New sign-in to your account'})}
                    </Text>
                    <Text style={styles.sub}>
                        {intl.formatMessage({id: 'sign_in_warning.detail', defaultMessage: '{device} · {time}'}, {device, time})}
                    </Text>
                    <Text style={styles.hint}>
                        {intl.formatMessage({id: 'sign_in_warning.hint', defaultMessage: 'Not you? Disconnect it, then change your password.'})}
                    </Text>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.button, styles.itsMeButton]}
                    disabled={busy}
                    onPress={onItsMe}
                    testID={`sign_in_warning.card.${signIn.session_id}.its_me`}
                >
                    <Text style={styles.itsMeText}>
                        {intl.formatMessage({id: 'sign_in_warning.its_me', defaultMessage: 'It\'s me'})}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.disconnectButton]}
                    disabled={busy}
                    onPress={async () => {
                        setBusy(true);
                        if (!await onDisconnect()) {
                            setBusy(false);
                        }
                    }}
                    testID={`sign_in_warning.card.${signIn.session_id}.disconnect`}
                >
                    <Text style={styles.disconnectText}>
                        {intl.formatMessage({id: 'sign_in_warning.disconnect', defaultMessage: 'Disconnect'})}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export type Props = {
    signIns: SignIn[];
    onItsMe: (sessionId: string) => void;
    onDisconnect: (sessionId: string) => Promise<boolean>;
};

// SignInWarning warns the user, at the top of the channel list, when someone signs in to their account (on any
// device, their own phone included) while they're connected: the device, the app or browser, and when.
// "Disconnect" signs that session out; "It's me" dismisses the warning. Either way, every one of their devices
// learns of it (session_revoked, session_acknowledged) and the warning goes from all of them.
export default function SignInWarning({signIns, onItsMe, onDisconnect}: Props) {
    const theme = useTheme();
    const styles = getStyleSheet(theme);

    if (!signIns.length) {
        return null;
    }

    const shown = signIns.slice(0, MAX_SHOWN_SIGN_INS);
    const more = signIns.length - shown.length;

    return (
        <View
            style={styles.container}
            testID='sign_in_warning'
        >
            {shown.map((signIn) => (
                <SignInCard
                    key={signIn.session_id}
                    signIn={signIn}
                    onItsMe={() => onItsMe(signIn.session_id)}
                    onDisconnect={() => onDisconnect(signIn.session_id)}
                />
            ))}
            {more > 0 && (
                <FormattedText
                    id='sign_in_warning.more'
                    defaultMessage='{count, plural, one {# more sign-in} other {# more sign-ins}}'
                    values={{count: more}}
                    style={styles.more}
                />
            )}
        </View>
    );
}
