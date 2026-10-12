// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase} from '@nozbe/watermelondb/react';
import React, {useEffect, useState} from 'react';
import {useIntl} from 'react-intl';
import {type StyleProp, Text, type TextStyle} from 'react-native';

import {useTheme} from '@context/theme';
import {formatTimestamp} from '@utils/dynamic_timestamp';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import {withReaderTime} from '../reader_time';

type Props = {
    seconds: number;
    timestampStyle: string;
    literal: string;
    textStyle: StyleProp<TextStyle>;

    // From withReaderTime
    readerZone: string;
    isMilitaryTime: boolean;
};

const MINUTE = 60 * 1000;

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    timestamp: {
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
        borderRadius: 3,
    },
}));

// DynamicTimestamp shows a "<t:…>" timestamp in the reader's time zone and format, as Discord and Fusion do; a
// relative one ("in 5 minutes") keeps up with the time.
export function DynamicTimestamp({seconds, timestampStyle, literal, textStyle, readerZone, isMilitaryTime}: Props) {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const [now, setNow] = useState(Date.now);

    useEffect(() => {
        if (timestampStyle !== 'R') {
            return undefined;
        }
        const interval = setInterval(() => setNow(Date.now()), MINUTE);
        return () => clearInterval(interval);
    }, [timestampStyle]);

    const shown = formatTimestamp(seconds, timestampStyle, {locale: intl.locale, timeZone: readerZone, hour12: !isMilitaryTime, now}) || literal;
    const full = formatTimestamp(seconds, 'F', {locale: intl.locale, timeZone: readerZone, hour12: !isMilitaryTime});

    return (
        <Text
            style={[textStyle, styles.timestamp]}
            accessibilityLabel={full}
            testID='markdown_timestamp'
        >
            {shown}
        </Text>
    );
}

export default withDatabase(withReaderTime(DynamicTimestamp));
