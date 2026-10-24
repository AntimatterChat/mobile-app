// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {FlatList, type ListRenderItem, RefreshControl, Text, TouchableOpacity, View} from 'react-native';

import {showPermalink} from '@actions/remote/permalink';
import {joinCallAndOpenCallScreen} from '@calls/actions/calls';
import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {formatMeetingTime} from '../../utils/format';
import {groupOccurrencesByDay, type ScheduleGroup} from '../../utils/schedule';

import type {MeetingOccurrence} from '../../types/calendar';

const messages = defineMessages({
    today: {id: 'calendar.schedule.today', defaultMessage: 'Today'},
    tomorrow: {id: 'calendar.schedule.tomorrow', defaultMessage: 'Tomorrow'},
    empty: {id: 'calendar.schedule.empty', defaultMessage: 'No calls are scheduled.'},
    live: {id: 'calendar.schedule.live', defaultMessage: 'Live · Join'},
});

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    sectionHeader: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Heading', 75),
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 10,
    },
    time: {
        width: 56,
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75),
    },
    main: {
        flex: 1,
        gap: 2,
    },
    title: {
        color: theme.centerChannelColor,
        ...typography('Body', 200, 'SemiBold'),
    },
    sub: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75),
    },
    icon: {
        color: changeOpacity(theme.centerChannelColor, 0.56),
        fontSize: 16,
    },
    liveLabel: {
        color: theme.sidebarTextActiveColor || theme.buttonBg,
        ...typography('Body', 75, 'SemiBold'),
    },
    empty: {
        padding: 24,
        textAlign: 'center',
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 200),
    },
}));

type FlatItem =
    | {type: 'header'; key: string; group: ScheduleGroup}
    | {type: 'row'; key: string; occurrence: MeetingOccurrence};

function flatten(groups: ScheduleGroup[]): FlatItem[] {
    const items: FlatItem[] = [];
    for (const group of groups) {
        items.push({type: 'header', key: `h-${group.key}`, group});
        for (const occurrence of group.occurrences) {
            items.push({type: 'row', key: `${occurrence.meeting_id}-${occurrence.start}`, occurrence});
        }
    }
    return items;
}

function groupLabel(group: ScheduleGroup, intl: ReturnType<typeof useIntl>): string {
    if (group.label === 'today') {
        return intl.formatMessage(messages.today);
    }
    if (group.label === 'tomorrow') {
        return intl.formatMessage(messages.tomorrow);
    }
    return intl.formatDate(group.date, {weekday: 'long', month: 'short', day: 'numeric'});
}

type Props = {
    occurrences: MeetingOccurrence[];
    loading: boolean;
    onRefresh: () => void;
    onLoadMore: () => void;
};

const ScheduleList = ({occurrences, loading, onRefresh, onLoadMore}: Props) => {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const serverUrl = useServerUrl();
    const [now] = useState(() => Date.now());

    const groups = useMemo(() => groupOccurrencesByDay(occurrences, new Date(now)), [occurrences, now]);
    const items = useMemo(() => flatten(groups), [groups]);

    const onOpenPost = useCallback((occurrence: MeetingOccurrence) => {
        showPermalink(serverUrl, '', occurrence.post_id);
    }, [serverUrl]);

    const onJoin = useCallback((occurrence: MeetingOccurrence) => {
        joinCallAndOpenCallScreen(intl, serverUrl, occurrence.channel_id);
    }, [intl, serverUrl]);

    const renderItem: ListRenderItem<FlatItem> = useCallback(({item}) => {
        if (item.type === 'header') {
            const label = groupLabel(item.group, intl);
            return (
                <Text
                    style={styles.sectionHeader}
                    testID={`calendar.schedule.header.${item.group.key}`}
                >
                    {label}
                </Text>
            );
        }

        const occurrence = item.occurrence;
        const live = occurrence.start <= now && now < occurrence.end;

        return (
            <TouchableOpacity
                onPress={() => onOpenPost(occurrence)}
                style={styles.row}
                testID={`calendar.schedule.row.${occurrence.meeting_id}`}
            >
                <Text style={styles.time}>{formatMeetingTime(occurrence.start, intl)}</Text>
                <View style={styles.main}>
                    <Text
                        numberOfLines={1}
                        style={styles.title}
                    >
                        {occurrence.summary}
                    </Text>
                    <Text
                        numberOfLines={1}
                        style={styles.sub}
                    >
                        {`#${occurrence.channel_display_name || occurrence.channel_name}`}
                    </Text>
                </View>
                {occurrence.recurring && (
                    <CompassIcon
                        name='refresh'
                        style={styles.icon}
                        testID={`calendar.schedule.recurring.${occurrence.meeting_id}`}
                    />
                )}
                {occurrence.my_rsvp && (
                    <Text
                        style={styles.sub}
                        testID={`calendar.schedule.rsvp.${occurrence.meeting_id}`}
                    >
                        {occurrence.my_rsvp}
                    </Text>
                )}
                {live && (
                    <TouchableOpacity
                        onPress={() => onJoin(occurrence)}
                        testID={`calendar.schedule.join.${occurrence.meeting_id}`}
                    >
                        <Text style={styles.liveLabel}>{intl.formatMessage(messages.live)}</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    }, [intl, now, onJoin, onOpenPost, styles]);

    return (
        <FlatList
            data={items}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={(
                <RefreshControl
                    refreshing={loading}
                    onRefresh={onRefresh}
                />
            )}
            ListEmptyComponent={loading ? null : (
                <FormattedText
                    id={messages.empty.id}
                    defaultMessage={messages.empty.defaultMessage}
                    style={styles.empty}
                    testID='calendar.schedule.empty'
                />
            )}
            testID='calendar.schedule.list'
        />
    );
};

export default ScheduleList;
