// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {Alert, Pressable, Text, View} from 'react-native';

import {joinCallAndOpenCallScreen} from '@calls/actions/calls';
import Button from '@components/button';
import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {usePreventDoubleTap} from '@hooks/utils';
import {bottomSheet, navigateToScreen} from '@screens/navigation';
import {getFullErrorMessage} from '@utils/errors';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {downloadAndShareMeetingIcs} from '../../actions/remote/ics';
import {cancelMeeting, fetchMeeting, rsvpMeeting} from '../../actions/remote/meetings';
import {CALENDAR_MEETING_POST_TYPE} from '../../constants';
import {calendarStore} from '../../store';
import {formatMeetingTimeRange} from '../../utils/format';
import {describeRecurrence} from '../../utils/recurrence';

import RemindMeSheet from './remind_me_sheet';

import type {Meeting, RsvpStatus} from '../../types/calendar';
import type PostModel from '@typings/database/models/servers/post';

export const messages = defineMessages({
    loading: {id: 'calendar.meeting.loading', defaultMessage: 'Loading the call…'},
    unavailable: {id: 'calendar.meeting.unavailable', defaultMessage: 'This call is no longer available.'},
    cancelled: {id: 'calendar.meeting.cancelled', defaultMessage: 'This call has been cancelled.'},
    join: {id: 'calendar.meeting.join', defaultMessage: 'Join'},
    going: {id: 'calendar.meeting.going', defaultMessage: 'Going'},
    maybe: {id: 'calendar.meeting.maybe', defaultMessage: 'Maybe'},
    no: {id: 'calendar.meeting.no', defaultMessage: 'No'},
    onlyNextCall: {id: 'calendar.meeting.only_next_call', defaultMessage: 'Only the next call'},
    remindMe: {id: 'calendar.meeting.remind_me', defaultMessage: 'Remind me'},
    addToCalendar: {id: 'calendar.meeting.add_to_calendar', defaultMessage: 'Add to calendar'},
    edit: {id: 'calendar.meeting.edit', defaultMessage: 'Edit'},
    cancelCall: {id: 'calendar.meeting.cancel', defaultMessage: 'Cancel'},
    cancelThisCall: {id: 'calendar.meeting.cancel_this_call', defaultMessage: 'This call'},
    cancelWholeSeries: {id: 'calendar.meeting.cancel_whole_series', defaultMessage: 'The whole series'},
    cancelDialogTitle: {id: 'calendar.meeting.cancel_dialog_title', defaultMessage: 'Cancel this call?'},
    cancelConfirmTitle: {id: 'calendar.meeting.cancel_confirm_title', defaultMessage: 'Cancel the call?'},
    cancelConfirmMessage: {id: 'calendar.meeting.cancel_confirm_message', defaultMessage: 'Members will no longer be reminded about it.'},
    cancelConfirmSeriesMessage: {id: 'calendar.meeting.cancel_confirm_series_message', defaultMessage: 'The whole series will be cancelled. Members will no longer be reminded about any of it.'},
    dismiss: {id: 'calendar.meeting.dismiss', defaultMessage: 'Dismiss'},
    confirm: {id: 'calendar.meeting.confirm', defaultMessage: 'Confirm'},
    cancelAlertCancel: {id: 'calendar.meeting.cancel_alert_cancel', defaultMessage: 'Cancel'},
    nextOccurrence: {id: 'calendar.meeting.next_occurrence', defaultMessage: 'Next: {time}'},
    actionFailed: {id: 'calendar.meeting.action_failed', defaultMessage: 'That didn\'t work: {error}'},
});

// isCalendarMeetingPost tells whether a post is a scheduled call the app shows natively, in
// place of its fallback message.
export function isCalendarMeetingPost(post: PostModel): boolean {
    return post.type === CALENDAR_MEETING_POST_TYPE && typeof post.props?.meeting_id === 'string';
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    card: {
        borderWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.16),
        borderRadius: 8,
        padding: 12,
        gap: 8,
        backgroundColor: theme.centerChannelBg,
    },
    title: {
        color: theme.centerChannelColor,
        ...typography('Heading', 200, 'SemiBold'),
    },
    sub: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75),
    },
    cancelledBanner: {
        color: theme.errorTextColor,
        ...typography('Body', 75, 'SemiBold'),
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    checkboxIcon: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        fontSize: 18,
    },
    checkboxLabel: {
        color: changeOpacity(theme.centerChannelColor, 0.72),
        ...typography('Body', 75),
    },
}));

type Props = {
    post: PostModel;
    isReplyPost: boolean;
    currentUserId: string;
};

const MeetingPost = ({post, currentUserId}: Props) => {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const serverUrl = useServerUrl();
    const meetingId = typeof post.props?.meeting_id === 'string' ? post.props.meeting_id : '';

    const [meeting, setMeeting] = useState<Meeting | null | undefined>(undefined);
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback(async () => {
        const result = await fetchMeeting(serverUrl, meetingId);
        setMeeting(result.data ?? null);
    }, [serverUrl, meetingId]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const sub = calendarStore.observeChanged(serverUrl).subscribe((signal) => {
            if (signal?.id === meetingId) {
                load();
            }
        });
        return () => sub.unsubscribe();
    }, [serverUrl, meetingId, load]);

    const [nextOnly, setNextOnly] = useState(false);
    useEffect(() => {
        setNextOnly(Boolean(meeting?.my_rsvp_next_only));
    }, [meeting?.my_rsvp_next_only]);

    const isRecurring = Boolean(meeting?.recurrence_rule);
    const recurrenceText = useMemo(() => describeRecurrence(meeting?.recurrence_rule, intl), [meeting?.recurrence_rule, intl]);

    const onAction = useCallback(async (key: string, action: () => Promise<{data?: Meeting; error?: unknown}>) => {
        setBusy(key);
        try {
            const result = await action();
            if (result.error) {
                Alert.alert('', intl.formatMessage(messages.actionFailed, {error: getFullErrorMessage(result.error)}));
            } else if (result.data) {
                setMeeting(result.data);
            }
        } finally {
            setBusy(null);
        }
    }, [intl]);

    const onJoin = usePreventDoubleTap(useCallback(() => {
        joinCallAndOpenCallScreen(intl, serverUrl, post.channelId);
    }, [intl, serverUrl, post.channelId]));

    const onRsvp = useCallback((status: RsvpStatus) => {
        onAction(`rsvp_${status}`, () => rsvpMeeting(serverUrl, meetingId, {status, scope: nextOnly ? 'next' : undefined}));
    }, [onAction, serverUrl, meetingId, nextOnly]);

    const onToggleNextOnly = usePreventDoubleTap(useCallback(() => {
        setNextOnly((v) => !v);
    }, []));

    const onRemindMe = usePreventDoubleTap(useCallback(() => {
        if (!meeting) {
            return;
        }
        const renderContent = () => (
            <RemindMeSheet
                meeting={meeting}
                onChanged={setMeeting}
            />
        );
        bottomSheet(renderContent, [1, 440]);
    }, [meeting]));

    const onAddToCalendar = usePreventDoubleTap(useCallback(() => {
        onAction('ics', async () => {
            const result = await downloadAndShareMeetingIcs(serverUrl, meetingId);
            return result.error ? {error: result.error} : {};
        });
    }, [onAction, serverUrl, meetingId]));

    const onEdit = usePreventDoubleTap(useCallback(() => {
        if (!meeting) {
            return;
        }
        navigateToScreen(Screens.CALENDAR_MEETING_EDIT, {meetingId: meeting.id});
    }, [meeting]));

    const doCancel = useCallback((scope?: 'occurrence') => {
        onAction('cancel', () => cancelMeeting(serverUrl, meetingId, scope));
    }, [onAction, serverUrl, meetingId]);

    const confirmCancel = useCallback((scope?: 'occurrence') => {
        Alert.alert(
            intl.formatMessage(messages.cancelConfirmTitle),
            intl.formatMessage(scope === 'occurrence' ? messages.cancelConfirmMessage : messages.cancelConfirmSeriesMessage),
            [
                {text: intl.formatMessage(messages.cancelAlertCancel), style: 'cancel'},
                {text: intl.formatMessage(messages.confirm), style: 'destructive', onPress: () => doCancel(scope)},
            ],
        );
    }, [intl, doCancel]);

    const onCancel = usePreventDoubleTap(useCallback(() => {
        if (!isRecurring) {
            confirmCancel(undefined);
            return;
        }
        Alert.alert(
            intl.formatMessage(messages.cancelDialogTitle),
            undefined,
            [
                {text: intl.formatMessage(messages.cancelAlertCancel), style: 'cancel'},
                {text: intl.formatMessage(messages.cancelThisCall), onPress: () => confirmCancel('occurrence')},
                {text: intl.formatMessage(messages.cancelWholeSeries), style: 'destructive', onPress: () => confirmCancel(undefined)},
            ],
        );
    }, [intl, isRecurring, confirmCancel]));

    if (meeting === undefined) {
        return (
            <View
                style={styles.card}
                testID='calendar.meeting_post.loading'
            >
                <FormattedText
                    id={messages.loading.id}
                    defaultMessage={messages.loading.defaultMessage}
                    style={styles.sub}
                />
            </View>
        );
    }

    if (meeting === null) {
        return (
            <Text
                style={styles.sub}
                testID='calendar.meeting_post.unavailable'
            >
                {post.message || intl.formatMessage(messages.unavailable)}
            </Text>
        );
    }

    const displayStart = meeting.next_start ?? meeting.start;
    const displayEnd = meeting.next_end ?? meeting.end;
    const timeRange = formatMeetingTimeRange(displayStart, displayEnd, intl);
    const isOrganizer = meeting.organizer_id === currentUserId;
    const declined = meeting.my_rsvp === 'no';
    const showNextOccurrence = isRecurring && meeting.next_start !== undefined && meeting.next_start !== meeting.start && !meeting.cancelled;

    return (
        <View
            style={styles.card}
            testID='calendar.meeting_post'
        >
            <Text style={styles.title}>{meeting.summary}</Text>
            <Text style={styles.sub}>{timeRange}</Text>
            {Boolean(recurrenceText) && <Text style={styles.sub}>{recurrenceText}</Text>}
            {showNextOccurrence && (
                <Text style={styles.sub}>
                    {intl.formatMessage(messages.nextOccurrence, {time: formatMeetingTimeRange(meeting.next_start!, meeting.next_end!, intl)})}
                </Text>
            )}
            {meeting.cancelled && (
                <FormattedText
                    id={messages.cancelled.id}
                    defaultMessage={messages.cancelled.defaultMessage}
                    style={styles.cancelledBanner}
                    testID='calendar.meeting_post.cancelled'
                />
            )}

            {!meeting.cancelled && (
                <View style={styles.row}>
                    <Button
                        theme={theme}
                        size='s'
                        emphasis='primary'
                        text={intl.formatMessage(messages.join)}
                        onPress={onJoin}
                        testID='calendar.meeting_post.join'
                    />
                    <Button
                        theme={theme}
                        size='s'
                        emphasis={meeting.my_rsvp === 'going' ? 'primary' : 'tertiary'}
                        text={intl.formatMessage(messages.going)}
                        onPress={() => onRsvp('going')}
                        showLoader={busy === 'rsvp_going'}
                        testID='calendar.meeting_post.rsvp_going'
                    />
                    <Button
                        theme={theme}
                        size='s'
                        emphasis={meeting.my_rsvp === 'maybe' ? 'primary' : 'tertiary'}
                        text={intl.formatMessage(messages.maybe)}
                        onPress={() => onRsvp('maybe')}
                        showLoader={busy === 'rsvp_maybe'}
                        testID='calendar.meeting_post.rsvp_maybe'
                    />
                    <Button
                        theme={theme}
                        size='s'
                        emphasis={meeting.my_rsvp === 'no' ? 'primary' : 'tertiary'}
                        text={intl.formatMessage(messages.no)}
                        onPress={() => onRsvp('no')}
                        showLoader={busy === 'rsvp_no'}
                        testID='calendar.meeting_post.rsvp_no'
                    />
                </View>
            )}

            {!meeting.cancelled && isRecurring && meeting.next_start !== undefined && (
                <Pressable
                    accessibilityRole='checkbox'
                    accessibilityState={{checked: nextOnly}}
                    onPress={onToggleNextOnly}
                    style={styles.checkboxRow}
                    testID='calendar.meeting_post.next_only'
                >
                    <CompassIcon
                        name={nextOnly ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        style={styles.checkboxIcon}
                    />
                    <Text style={styles.checkboxLabel}>{intl.formatMessage(messages.onlyNextCall)}</Text>
                </Pressable>
            )}

            <View style={styles.row}>
                {!meeting.cancelled && !declined && (
                    <Button
                        theme={theme}
                        size='s'
                        emphasis='tertiary'
                        iconName='bell-outline'
                        text={intl.formatMessage(messages.remindMe)}
                        onPress={onRemindMe}
                        testID='calendar.meeting_post.remind_me'
                    />
                )}
                <Button
                    theme={theme}
                    size='s'
                    emphasis='tertiary'
                    iconName='calendar-plus'
                    text={intl.formatMessage(messages.addToCalendar)}
                    onPress={onAddToCalendar}
                    showLoader={busy === 'ics'}
                    testID='calendar.meeting_post.add_to_calendar'
                />
                {isOrganizer && !meeting.cancelled && (
                    <Button
                        theme={theme}
                        size='s'
                        emphasis='tertiary'
                        iconName='pencil-outline'
                        text={intl.formatMessage(messages.edit)}
                        onPress={onEdit}
                        testID='calendar.meeting_post.edit'
                    />
                )}
                {meeting.can_cancel && !meeting.cancelled && (
                    <Button
                        theme={theme}
                        size='s'
                        emphasis='tertiary'
                        isDestructive={true}
                        iconName='close-circle-outline'
                        text={intl.formatMessage(messages.cancelCall)}
                        onPress={onCancel}
                        showLoader={busy === 'cancel'}
                        testID='calendar.meeting_post.cancel'
                    />
                )}
            </View>
        </View>
    );
};

export default MeetingPost;
