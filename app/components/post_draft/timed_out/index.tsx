// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';
import {Text, View} from 'react-native';
import {type Edge, SafeAreaView} from 'react-native-safe-area-context';

import CompassIcon from '@components/compass_icon';
import {useTheme} from '@context/theme';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

type Props = {
    until: number;
    testID?: string;
}

const getStyle = makeStyleSheetFromTheme((theme: Theme) => ({
    wrapper: {
        backgroundColor: theme.centerChannelBg,
    },
    background: {
        backgroundColor: changeOpacity(theme.dndIndicator, 0.08),
    },
    container: {
        alignItems: 'center',
        borderTopColor: changeOpacity(theme.centerChannelColor, 0.20),
        borderTopWidth: 1,
        flexDirection: 'row',
        minHeight: 50,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 9,
    },
    text: {
        flex: 1,
        color: changeOpacity(theme.centerChannelColor, 0.72),
        ...typography('Body', 100),
    },
}));

const edges: Edge[] = ['bottom'];

// The current day shows the time only: "until 3:45 PM"; later ones say which: "until Fri 3:45 PM".
const TIME_FORMAT = {hour: 'numeric', minute: '2-digit'} as const;
const DAY_TIME_FORMAT = {weekday: 'short', hour: 'numeric', minute: '2-digit'} as const;

// TimedOut takes the composer's place while the current user is timed out of the channel's team (Antimatter
// moderation), as Fusion says it, so that they don't find out by having their messages fail.
export default function TimedOut({until, testID}: Props) {
    const intl = useIntl();
    const theme = useTheme();
    const style = getStyle(theme);
    const sameDay = new Date(until).toDateString() === new Date().toDateString();
    const time = intl.formatDate(until, sameDay ? TIME_FORMAT : DAY_TIME_FORMAT);

    return (
        <View style={style.wrapper}>
            <SafeAreaView
                edges={edges}
                style={style.background}
            >
                <View
                    testID={testID}
                    style={style.container}
                >
                    <CompassIcon
                        name='clock-outline'
                        size={20}
                        color={theme.dndIndicator}
                    />
                    <Text style={style.text}>
                        {intl.formatMessage({id: 'mobile.create_post.timed_out', defaultMessage: 'You\'re timed out until {time}: you can read, but not send messages or react.'}, {time})}
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );
}
