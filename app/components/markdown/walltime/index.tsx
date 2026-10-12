// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase} from '@nozbe/watermelondb/react';
import React from 'react';
import {useIntl} from 'react-intl';
import {type StyleProp, Text, type TextStyle} from 'react-native';

import CompassIcon from '@components/compass_icon';
import {useTheme} from '@context/theme';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {formatWalltime, offsetAt, wallDay, type Zone} from '@utils/walltime';

import {withReaderTime} from '../reader_time';

type Props = {
    literal: string;
    start: number;
    end?: number;
    zone: Zone;
    explicit: boolean;
    textStyle: StyleProp<TextStyle>;

    // From withReaderTime
    readerZone: string;
    isMilitaryTime: boolean;
    walltimesEnabled: boolean;
};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    local: {color: changeOpacity(theme.centerChannelColor, 0.64)},
}));

// Walltime is a time written in a message ("3pm CET"), followed by the reader's own time when it's given in a time
// zone or the reader's isn't its author's, as Fusion's tooltip says; otherwise it's plain text.
export function Walltime({literal, start, end, zone, explicit, textStyle, readerZone, isMilitaryTime, walltimesEnabled}: Props) {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);

    if (!walltimesEnabled || (!explicit && offsetAt(readerZone, start) === offsetAt(zone, start))) {
        return <Text style={textStyle}>{literal}</Text>;
    }

    // The reader's date shows when the time isn't today for them, or isn't on the day written.
    const localDay = wallDay(readerZone, start);
    const otherDay = localDay !== wallDay(zone, start);
    const local = formatWalltime({start, end}, readerZone, {hour12: !isMilitaryTime, withDate: otherDay || localDay !== wallDay(readerZone, Date.now())});
    const written = formatWalltime({start, end}, zone, {hour12: !isMilitaryTime, withDate: otherDay});
    const label = intl.formatMessage({id: 'markdown.walltime', defaultMessage: '{local} your time · {written} as written'}, {local, written});

    return (
        <Text
            style={textStyle}
            accessibilityLabel={label}
            testID='markdown_walltime'
        >
            {literal}
            <Text style={[textStyle, styles.local]}>
                {' ('}
                <CompassIcon
                    name='clock-outline'
                    style={styles.local}
                />
                {` ${local})`}
            </Text>
        </Text>
    );
}

export default withDatabase(withReaderTime(Walltime));
