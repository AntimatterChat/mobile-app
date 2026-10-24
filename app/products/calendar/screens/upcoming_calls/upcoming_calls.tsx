// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useIsFocused} from '@react-navigation/native';
import React, {useEffect, useMemo} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {getLocales} from 'react-native-localize';
import {Text, TouchableOpacity, View} from 'react-native';

import {useTheme} from '@context/theme';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {useMeetingsRange} from '../../hooks/use_meetings_range';
import {useScheduleMeetings} from '../../hooks/use_schedule_meetings';
import {useUpcomingCallsView, type UpcomingCallsView} from '../../hooks/use_upcoming_calls_view';
import {addDays, getFirstDayOfWeek, startOfDay, startOfWeek, weekDays} from '../../utils/grid';

import DayWeekGrid from './day_week_grid';
import ScheduleList from './schedule_list';

const messages = defineMessages({
    schedule: {id: 'calendar.upcoming_calls.schedule', defaultMessage: 'Schedule'},
    day: {id: 'calendar.upcoming_calls.day', defaultMessage: 'Day'},
    week: {id: 'calendar.upcoming_calls.week', defaultMessage: 'Week'},
    today: {id: 'calendar.upcoming_calls.today', defaultMessage: 'Today'},
});

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.centerChannelBg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
        gap: 8,
    },
    switchRow: {
        flexDirection: 'row',
        gap: 4,
        flex: 1,
    },
    switchItem: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.04),
    },
    switchItemActive: {
        backgroundColor: theme.buttonBg,
    },
    switchLabel: {
        color: changeOpacity(theme.centerChannelColor, 0.72),
        ...typography('Body', 100, 'SemiBold'),
    },
    switchLabelActive: {
        color: theme.buttonColor,
    },
    todayButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    todayLabel: {
        color: theme.buttonBg,
        ...typography('Body', 75, 'SemiBold'),
    },
}));

export type UpcomingCallsProps = {
    teamId?: string;
};

const VIEWS: UpcomingCallsView[] = ['schedule', 'day', 'week'];

const UpcomingCalls = ({teamId}: UpcomingCallsProps) => {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const isFocused = useIsFocused();
    const [view, setView] = useUpcomingCallsView();
    const [anchor, setAnchor] = React.useState(() => new Date());

    const firstDayOfWeek = useMemo(() => getFirstDayOfWeek(getLocales()[0]?.countryCode), []);

    const columnDates = useMemo(() => {
        if (view === 'day') {
            return [startOfDay(anchor)];
        }
        return weekDays(startOfWeek(anchor, firstDayOfWeek));
    }, [view, anchor, firstDayOfWeek]);

    // The grid swipes across a padded window (one extra unit either side) so the
    // neighbouring page already has data once the swipe settles.
    const gridFrom = useMemo(() => {
        const first = columnDates[0];
        return (view === 'day' ? addDays(first, -1) : addDays(first, -7)).getTime();
    }, [columnDates, view]);
    const gridTo = useMemo(() => {
        const last = columnDates[columnDates.length - 1];
        const padded = view === 'day' ? addDays(last, 2) : addDays(last, 8);
        return padded.getTime();
    }, [columnDates, view]);

    const schedule = useScheduleMeetings(teamId);
    const grid = useMeetingsRange(teamId, gridFrom, gridTo);

    useEffect(() => {
        if (!isFocused) {
            return;
        }
        if (view === 'schedule') {
            schedule.refresh();
        } else {
            grid.refresh();
        }

        // Only the focus transition (and the view it lands on) should trigger this; the
        // refresh functions themselves are stable per (serverUrl, teamId).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFocused, view]);

    const labelFor = (v: UpcomingCallsView) => {
        switch (v) {
            case 'day': return intl.formatMessage(messages.day);
            case 'week': return intl.formatMessage(messages.week);
            default: return intl.formatMessage(messages.schedule);
        }
    };

    const onOpenDay = (date: Date) => {
        setAnchor(date);
        setView('day');
    };

    return (
        <View
            style={styles.container}
            testID='calendar.upcoming_calls'
        >
            <View style={styles.header}>
                <View
                    accessibilityRole='tablist'
                    style={styles.switchRow}
                >
                    {VIEWS.map((v) => (
                        <TouchableOpacity
                            accessibilityRole='tab'
                            accessibilityState={{selected: view === v}}
                            key={v}
                            onPress={() => setView(v)}
                            style={[styles.switchItem, view === v && styles.switchItemActive]}
                            testID={`calendar.upcoming_calls.switch.${v}`}
                        >
                            <Text style={[styles.switchLabel, view === v && styles.switchLabelActive]}>
                                {labelFor(v)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {view !== 'schedule' && (
                    <TouchableOpacity
                        onPress={() => setAnchor(new Date())}
                        style={styles.todayButton}
                        testID='calendar.upcoming_calls.today'
                    >
                        <Text style={styles.todayLabel}>{intl.formatMessage(messages.today)}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {view === 'schedule' && (
                <ScheduleList
                    occurrences={schedule.occurrences}
                    loading={schedule.loading}
                    onRefresh={schedule.refresh}
                    onLoadMore={schedule.loadMore}
                />
            )}
            {view !== 'schedule' && (
                <DayWeekGrid
                    mode={view}
                    date={anchor}
                    occurrences={grid.occurrences}
                    firstDayOfWeek={firstDayOfWeek}
                    columnDates={columnDates}
                    onDateChange={setAnchor}
                    onOpenDay={onOpenDay}
                />
            )}
        </View>
    );
};

export default UpcomingCalls;
