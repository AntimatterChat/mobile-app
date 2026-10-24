// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {useIntl} from 'react-intl';
import {
    Dimensions,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import {showPermalink} from '@actions/remote/permalink';
import {joinCallAndOpenCallScreen} from '@calls/actions/calls';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {advanceDate, layoutDayEvents, nowLineFraction, startOfDay, type GridMode} from '../../utils/grid';

import type {MeetingOccurrence} from '../../types/calendar';

export const HOUR_HEIGHT = 56;
const HOURS = 24;

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    page: {
        flexDirection: 'row',
    },
    hourLabels: {
        width: 48,
    },
    hourLabel: {
        height: HOUR_HEIGHT,
        color: changeOpacity(theme.centerChannelColor, 0.56),
        ...typography('Body', 50),
        paddingTop: 2,
        paddingLeft: 4,
    },
    column: {
        flex: 1,
        borderLeftWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.08),
    },
    columnHeader: {
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    columnHeaderText: {
        color: changeOpacity(theme.centerChannelColor, 0.72),
        ...typography('Body', 75, 'SemiBold'),
    },
    columnHeaderTextToday: {
        color: theme.buttonBg,
    },
    hourRow: {
        height: HOUR_HEIGHT,
        borderTopWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.06),
    },
    body: {
        position: 'relative',
        height: HOUR_HEIGHT * HOURS,
    },
    block: {
        position: 'absolute',
        borderRadius: 4,
        backgroundColor: theme.buttonBg,
        padding: 4,
        overflow: 'hidden',
    },
    blockText: {
        color: theme.buttonColor,
        ...typography('Body', 50, 'SemiBold'),
    },
    nowLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: theme.errorTextColor,
    },
}));

type Props = {
    mode: GridMode;
    date: Date;
    occurrences: MeetingOccurrence[];
    firstDayOfWeek: number;
    columnDates: Date[];
    onDateChange: (date: Date) => void;
    onOpenDay: (date: Date) => void;
};

const DayWeekGrid = ({mode, date, occurrences, columnDates, onDateChange, onOpenDay}: Props) => {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const serverUrl = useServerUrl();
    const [now] = React.useState(() => Date.now());
    const scrollRef = useRef<ScrollView | null>(null);
    const pageWidth = Dimensions.get('window').width;

    const onOpenPost = useCallback((occurrence: MeetingOccurrence) => {
        showPermalink(serverUrl, '', occurrence.post_id);
    }, [serverUrl]);

    const onJoin = useCallback((occurrence: MeetingOccurrence) => {
        joinCallAndOpenCallScreen(intl, serverUrl, occurrence.channel_id);
    }, [intl, serverUrl]);

    const columns = useMemo(() => columnDates.map((d) => {
        const dayStart = startOfDay(d);
        const dayEndMs = dayStart.getTime() + 24 * 60 * 60 * 1000;
        const dayOccurrences = occurrences.filter((o) => o.start < dayEndMs && o.end > dayStart.getTime());
        return {
            date: d,
            dayStart,
            layout: layoutDayEvents(dayOccurrences, dayStart),
            nowFraction: nowLineFraction(dayStart, now),
        };
    }), [columnDates, occurrences, now]);

    const onMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const page = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
        if (page === 1) {
            return;
        }
        const direction = page > 1 ? 1 : -1;
        onDateChange(advanceDate(date, mode, direction));
    }, [date, mode, onDateChange, pageWidth]);

    useEffect(() => {
        scrollRef.current?.scrollTo({x: pageWidth, animated: false});
    }, [date, pageWidth]);

    const renderColumns = () => (
        <View style={styles.page}>
            <View style={styles.hourLabels}>
                <View style={styles.columnHeader}/>
                {Array.from({length: HOURS}, (_, h) => (
                    <Text
                        key={h}
                        style={styles.hourLabel}
                    >
                        {intl.formatTime(new Date(2020, 0, 1, h), {hour: 'numeric'})}
                    </Text>
                ))}
            </View>
            {columns.map((col) => {
                const isToday = col.dayStart.getTime() === startOfDay(new Date(now)).getTime();
                return (
                    <View
                        key={col.date.toISOString()}
                        style={styles.column}
                        testID={`calendar.grid.column.${col.date.toISOString()}`}
                    >
                        <TouchableOpacity
                            disabled={mode === 'day'}
                            onPress={() => onOpenDay(col.date)}
                            style={styles.columnHeader}
                            testID={`calendar.grid.column_header.${col.date.toISOString()}`}
                        >
                            <Text style={[styles.columnHeaderText, isToday && styles.columnHeaderTextToday]}>
                                {intl.formatDate(col.date, {weekday: 'short', day: 'numeric'})}
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.body}>
                            {Array.from({length: HOURS}, (_, h) => (
                                <View
                                    key={h}
                                    style={styles.hourRow}
                                />
                            ))}
                            {col.layout.map(({item, column, columns: columnCount, top, height}) => (
                                <TouchableOpacity
                                    key={`${item.meeting_id}-${item.start}`}
                                    onPress={() => onOpenPost(item)}
                                    style={[
                                        styles.block,
                                        {
                                            top: `${top * 100}%`,
                                            height: `${Math.max(height * 100, 4)}%`,
                                            left: `${(column / columnCount) * 100}%`,
                                            width: `${(1 / columnCount) * 100}%`,
                                        },
                                    ]}
                                    testID={`calendar.grid.block.${item.meeting_id}-${item.start}`}
                                >
                                    <Text
                                        numberOfLines={1}
                                        style={styles.blockText}
                                    >
                                        {item.summary}
                                    </Text>
                                    {item.start <= now && now < item.end && (
                                        <TouchableOpacity
                                            onPress={() => onJoin(item)}
                                            testID={`calendar.grid.join.${item.meeting_id}-${item.start}`}
                                        >
                                            <Text style={styles.blockText}>{'Join'}</Text>
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                            ))}
                            {col.nowFraction !== null && (
                                <View
                                    style={[styles.nowLine, {top: `${col.nowFraction * 100}%`}]}
                                    testID='calendar.grid.now_line'
                                />
                            )}
                        </View>
                    </View>
                );
            })}
        </View>
    );

    return (
        <ScrollView
            ref={scrollRef}
            horizontal={true}
            pagingEnabled={true}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumScrollEnd}
            testID='calendar.grid.pager'
        >
            <View style={{width: pageWidth}}/>
            <View style={{width: pageWidth}}>
                {renderColumns()}
            </View>
            <View style={{width: pageWidth}}/>
        </ScrollView>
    );
};

export default DayWeekGrid;
