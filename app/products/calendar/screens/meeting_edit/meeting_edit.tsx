// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import DateTimePicker, {type DateTimePickerEvent} from '@react-native-community/datetimepicker';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {Alert, Platform, ScrollView, Text, View} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller';
import tinyColor from 'tinycolor2';

import Button from '@components/button';
import FloatingTextInputLabel from '@components/floating_input/floating_text_input_label';
import FormattedText from '@components/formatted_text';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {navigateBack} from '@screens/navigation';
import {getFullErrorMessage} from '@utils/errors';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {editMeeting, fetchMeeting} from '../../actions/remote/meetings';
import {DEFAULT_REMINDER_MINUTES} from '../../constants';
import {DAY_SHORT_NAME_IDS, WEEKDAY_CODES} from '../../utils/recurrence';
import {buildRecurrenceRule, recurrenceFormFromRule, type RecurrenceEndType, type RecurrenceFormFields, type RecurrenceFormFreq} from '../../utils/recurrence_form';
import {reminderChoices} from '../../utils/reminder';
import {validateMeetingForm, type MeetingFormError} from '../../utils/validation';

import type {Meeting} from '../../types/calendar';

export const messages = defineMessages({
    title: {id: 'calendar.edit.title', defaultMessage: 'Edit call'},
    summary: {id: 'calendar.edit.summary', defaultMessage: 'Title'},
    description: {id: 'calendar.edit.description', defaultMessage: 'Description'},
    start: {id: 'calendar.edit.start', defaultMessage: 'Start'},
    end: {id: 'calendar.edit.end', defaultMessage: 'End'},
    repeat: {id: 'calendar.edit.repeat', defaultMessage: 'Repeat'},
    repeatNone: {id: 'calendar.edit.repeat_none', defaultMessage: 'Never'},
    repeatDaily: {id: 'calendar.edit.repeat_daily', defaultMessage: 'Daily'},
    repeatWeekly: {id: 'calendar.edit.repeat_weekly', defaultMessage: 'Weekly'},
    repeatMonthly: {id: 'calendar.edit.repeat_monthly', defaultMessage: 'Monthly'},
    everyDays: {id: 'calendar.edit.every_days', defaultMessage: 'Every (days)'},
    everyWeeks: {id: 'calendar.edit.every_weeks', defaultMessage: 'Every (weeks)'},
    everyMonths: {id: 'calendar.edit.every_months', defaultMessage: 'Every (months)'},
    ends: {id: 'calendar.edit.ends', defaultMessage: 'Ends'},
    endsNever: {id: 'calendar.edit.ends_never', defaultMessage: 'Never'},
    endsOnDate: {id: 'calendar.edit.ends_on_date', defaultMessage: 'On date'},
    endsAfterN: {id: 'calendar.edit.ends_after_n', defaultMessage: 'After N'},
    reminder: {id: 'calendar.edit.reminder', defaultMessage: 'Reminder'},
    save: {id: 'calendar.edit.save', defaultMessage: 'Save'},
    loading: {id: 'calendar.edit.loading', defaultMessage: 'Loading…'},
    saveFailed: {id: 'calendar.edit.save_failed', defaultMessage: 'The call couldn\'t be saved: {error}'},
    errorNeedSummary: {id: 'calendar.edit.error.need_summary', defaultMessage: 'Give the call a title'},
    errorSummaryTooLong: {id: 'calendar.edit.error.summary_too_long', defaultMessage: 'The title is too long'},
    errorDescriptionTooLong: {id: 'calendar.edit.error.description_too_long', defaultMessage: 'The description is too long'},
    errorEndBeforeStart: {id: 'calendar.edit.error.end_before_start', defaultMessage: 'The call must end after it starts'},
    errorTooShort: {id: 'calendar.edit.error.too_short', defaultMessage: 'The call must last at least a minute'},
    errorTooLong: {id: 'calendar.edit.error.too_long', defaultMessage: 'The call can\'t last more than 24 hours'},
});

export const meetingEditTitle = messages.title;

const errorMessages: Record<MeetingFormError, typeof messages.errorNeedSummary> = {
    need_summary: messages.errorNeedSummary,
    summary_too_long: messages.errorSummaryTooLong,
    description_too_long: messages.errorDescriptionTooLong,
    end_before_start: messages.errorEndBeforeStart,
    too_short: messages.errorTooShort,
    too_long: messages.errorTooLong,
};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flex: 1,
        padding: 16,
        gap: 16,
    },
    label: {
        color: changeOpacity(theme.centerChannelColor, 0.72),
        ...typography('Body', 75, 'SemiBold'),
        marginBottom: 6,
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dateBox: {
        borderWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.16),
        borderRadius: 4,
        padding: 12,
    },
    dateText: {
        color: theme.centerChannelColor,
        ...typography('Body', 200, 'Regular'),
    },
    error: {
        color: theme.errorTextColor,
        ...typography('Body', 75, 'SemiBold'),
    },
}));

export type MeetingEditProps = {
    meetingId: string;
};

type PickerStage = 'start_date' | 'start_time' | 'end_date' | 'end_time' | 'until_date' | undefined;

function withDate(base: Date, date: Date): Date {
    const next = new Date(base);
    next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    return next;
}

function withTime(base: Date, time: Date): Date {
    const next = new Date(base);
    next.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return next;
}

function removeDay(byDay: string[], code: string): string[] {
    return byDay.filter((d) => d !== code);
}

function pickerValue(stage: PickerStage, start: Date, end: Date, until: number | undefined): Date {
    if (stage?.startsWith('start')) {
        return start;
    }
    if (stage?.startsWith('end')) {
        return end;
    }
    return until ? new Date(until) : new Date();
}

function everyMessage(freq: RecurrenceFormFields['freq']) {
    if (freq === 'DAILY') {
        return messages.everyDays;
    }
    if (freq === 'WEEKLY') {
        return messages.everyWeeks;
    }
    return messages.everyMonths;
}

const MeetingEdit = ({meetingId}: MeetingEditProps) => {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const serverUrl = useServerUrl();

    const [meeting, setMeeting] = useState<Meeting | undefined>(undefined);
    const [summary, setSummary] = useState('');
    const [description, setDescription] = useState('');
    const [start, setStart] = useState(() => new Date());
    const [end, setEnd] = useState(() => new Date(Date.now() + (30 * 60 * 1000)));
    const [recurrence, setRecurrence] = useState<RecurrenceFormFields>({freq: 'NONE', interval: 1, byDay: [], endType: 'never', count: 10});
    const [reminderMinutes, setReminderMinutes] = useState<number>(DEFAULT_REMINDER_MINUTES);
    const [pickerStage, setPickerStage] = useState<PickerStage>(undefined);
    const [error, setError] = useState<MeetingFormError | undefined>(undefined);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let mounted = true;
        fetchMeeting(serverUrl, meetingId).then((result) => {
            if (!mounted || !result.data) {
                return;
            }
            const m = result.data;
            setMeeting(m);
            setSummary(m.summary);
            setDescription(m.description);
            setStart(new Date(m.start));
            setEnd(new Date(m.end));
            setRecurrence(recurrenceFormFromRule(m.recurrence_rule));
            setReminderMinutes(m.reminder_minutes);
        });
        return () => {
            mounted = false;
        };
    }, [serverUrl, meetingId]);

    const onChangeDate = useCallback((_: DateTimePickerEvent, date?: Date) => {
        if (!date) {
            setPickerStage(undefined);
            return;
        }
        if (pickerStage === 'start_date') {
            setStart((s) => withDate(s, date));
            setPickerStage(Platform.OS === 'ios' ? undefined : 'start_time');
        } else if (pickerStage === 'start_time') {
            setStart((s) => withTime(s, date));
            setPickerStage(undefined);
        } else if (pickerStage === 'end_date') {
            setEnd((s) => withDate(s, date));
            setPickerStage(Platform.OS === 'ios' ? undefined : 'end_time');
        } else if (pickerStage === 'end_time') {
            setEnd((s) => withTime(s, date));
            setPickerStage(undefined);
        } else if (pickerStage === 'until_date') {
            setRecurrence((r) => ({...r, until: date.getTime()}));
            setPickerStage(undefined);
        }
    }, [pickerStage]);

    const toggleByDay = useCallback((code: string) => {
        setRecurrence((r) => {
            const byDay = r.byDay.includes(code) ? removeDay(r.byDay, code) : [...r.byDay, code];
            return {...r, byDay};
        });
    }, []);

    const onSave = useCallback(async () => {
        const problem = validateMeetingForm(summary, description, start.getTime(), end.getTime());
        setError(problem);
        if (problem) {
            return;
        }
        setSaving(true);
        try {
            const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
            const request = {
                summary,
                description,
                start: start.getTime(),
                end: end.getTime(),
                time_zone: timeZone,
                recurrence_rule: buildRecurrenceRule(recurrence),
                reminder_minutes: reminderMinutes as Meeting['reminder_minutes'],
            };
            const result = await editMeeting(serverUrl, meetingId, request);
            if (result.error) {
                Alert.alert('', intl.formatMessage(messages.saveFailed, {error: getFullErrorMessage(result.error)}));
                return;
            }
            navigateBack();
        } finally {
            setSaving(false);
        }
    }, [summary, description, start, end, recurrence, reminderMinutes, serverUrl, meetingId, intl]);

    const freqOptions: Array<{value: RecurrenceFormFreq; label: string}> = useMemo(() => [
        {value: 'NONE', label: intl.formatMessage(messages.repeatNone)},
        {value: 'DAILY', label: intl.formatMessage(messages.repeatDaily)},
        {value: 'WEEKLY', label: intl.formatMessage(messages.repeatWeekly)},
        {value: 'MONTHLY', label: intl.formatMessage(messages.repeatMonthly)},
    ], [intl]);

    const endOptions: Array<{value: RecurrenceEndType; label: string}> = useMemo(() => [
        {value: 'never', label: intl.formatMessage(messages.endsNever)},
        {value: 'on_date', label: intl.formatMessage(messages.endsOnDate)},
        {value: 'after_n', label: intl.formatMessage(messages.endsAfterN)},
    ], [intl]);

    if (!meeting) {
        return (
            <View
                style={styles.container}
                testID='calendar.meeting_edit.loading'
            >
                <FormattedText
                    id={messages.loading.id}
                    defaultMessage={messages.loading.defaultMessage}
                />
            </View>
        );
    }

    return (
        <KeyboardAwareScrollView
            contentContainerStyle={styles.container}
            testID='calendar.meeting_edit'
        >
            <FloatingTextInputLabel
                label={intl.formatMessage(messages.summary)}
                onChangeText={setSummary}
                theme={theme}
                value={summary}
                testID='calendar.meeting_edit.summary'
            />
            <FloatingTextInputLabel
                label={intl.formatMessage(messages.description)}
                multiline={true}
                onChangeText={setDescription}
                theme={theme}
                value={description}
                testID='calendar.meeting_edit.description'
            />

            <View>
                <Text style={styles.label}>{intl.formatMessage(messages.start)}</Text>
                <Button
                    theme={theme}
                    emphasis='tertiary'
                    size='m'
                    text={intl.formatDate(start, {weekday: 'short', month: 'short', day: 'numeric'}) + ' ' + intl.formatTime(start, {hour: 'numeric', minute: '2-digit'})}
                    onPress={() => setPickerStage('start_date')}
                    testID='calendar.meeting_edit.start'
                />
            </View>

            <View>
                <Text style={styles.label}>{intl.formatMessage(messages.end)}</Text>
                <Button
                    theme={theme}
                    emphasis='tertiary'
                    size='m'
                    text={intl.formatDate(end, {weekday: 'short', month: 'short', day: 'numeric'}) + ' ' + intl.formatTime(end, {hour: 'numeric', minute: '2-digit'})}
                    onPress={() => setPickerStage('end_date')}
                    testID='calendar.meeting_edit.end'
                />
            </View>

            <View>
                <Text style={styles.label}>{intl.formatMessage(messages.repeat)}</Text>
                <View style={styles.row}>
                    {freqOptions.map((opt) => (
                        <Button
                            key={opt.value}
                            theme={theme}
                            emphasis={recurrence.freq === opt.value ? 'primary' : 'tertiary'}
                            size='s'
                            text={opt.label}
                            onPress={() => setRecurrence((r) => ({...r, freq: opt.value}))}
                            testID={`calendar.meeting_edit.repeat.${opt.value}`}
                        />
                    ))}
                </View>
            </View>

            {recurrence.freq === 'WEEKLY' && (
                <View
                    style={styles.row}
                    testID='calendar.meeting_edit.byday'
                >
                    {WEEKDAY_CODES.map((code) => (
                        <Button
                            key={code}
                            theme={theme}
                            emphasis={recurrence.byDay.includes(code) ? 'primary' : 'tertiary'}
                            size='xs'
                            text={intl.formatMessage(DAY_SHORT_NAME_IDS[code])}
                            onPress={() => toggleByDay(code)}
                            testID={`calendar.meeting_edit.byday.${code}`}
                        />
                    ))}
                </View>
            )}

            {recurrence.freq !== 'NONE' && (
                <FloatingTextInputLabel
                    label={intl.formatMessage(everyMessage(recurrence.freq))}
                    keyboardType='number-pad'
                    onChangeText={(v) => setRecurrence((r) => ({...r, interval: Math.max(1, parseInt(v, 10) || 1)}))}
                    theme={theme}
                    value={String(recurrence.interval)}
                    testID='calendar.meeting_edit.interval'
                />
            )}

            {recurrence.freq !== 'NONE' && (
                <View>
                    <Text style={styles.label}>{intl.formatMessage(messages.ends)}</Text>
                    <View style={styles.row}>
                        {endOptions.map((opt) => (
                            <Button
                                key={opt.value}
                                theme={theme}
                                emphasis={recurrence.endType === opt.value ? 'primary' : 'tertiary'}
                                size='s'
                                text={opt.label}
                                onPress={() => setRecurrence((r) => ({...r, endType: opt.value}))}
                                testID={`calendar.meeting_edit.ends.${opt.value}`}
                            />
                        ))}
                    </View>
                    {recurrence.endType === 'on_date' && (
                        <Button
                            theme={theme}
                            emphasis='tertiary'
                            size='m'
                            text={recurrence.until ? intl.formatDate(recurrence.until, {year: 'numeric', month: 'short', day: 'numeric'}) : intl.formatMessage(messages.endsOnDate)}
                            onPress={() => setPickerStage('until_date')}
                            testID='calendar.meeting_edit.until'
                        />
                    )}
                    {recurrence.endType === 'after_n' && (
                        <FloatingTextInputLabel
                            label={intl.formatMessage(messages.endsAfterN)}
                            keyboardType='number-pad'
                            onChangeText={(v) => setRecurrence((r) => ({...r, count: Math.max(1, parseInt(v, 10) || 1)}))}
                            theme={theme}
                            value={String(recurrence.count)}
                            testID='calendar.meeting_edit.count'
                        />
                    )}
                </View>
            )}

            <View>
                <Text style={styles.label}>{intl.formatMessage(messages.reminder)}</Text>
                <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                >
                    <View style={styles.row}>
                        {reminderChoices(intl).map((choice) => (
                            <Button
                                key={String(choice.minutes)}
                                theme={theme}
                                emphasis={reminderMinutes === choice.minutes ? 'primary' : 'tertiary'}
                                size='s'
                                text={choice.label}
                                onPress={() => setReminderMinutes(choice.minutes as number)}
                                testID={`calendar.meeting_edit.reminder.${choice.minutes}`}
                            />
                        ))}
                    </View>
                </ScrollView>
            </View>

            {error && (
                <Text
                    style={styles.error}
                    testID='calendar.meeting_edit.error'
                >
                    {intl.formatMessage(errorMessages[error])}
                </Text>
            )}

            <Button
                theme={theme}
                size='lg'
                text={intl.formatMessage(messages.save)}
                onPress={onSave}
                showLoader={saving}
                testID='calendar.meeting_edit.save'
            />

            {pickerStage && (
                <DateTimePicker
                    value={pickerValue(pickerStage, start, end, recurrence.until)}
                    mode={pickerStage.endsWith('time') ? 'time' : 'date'}
                    display={Platform.select({ios: 'spinner', default: pickerStage.endsWith('time') ? 'clock' : 'calendar'})}
                    onChange={onChangeDate}
                    themeVariant={tinyColor(theme.centerChannelBg).isDark() ? 'dark' : 'light'}
                />
            )}
        </KeyboardAwareScrollView>
    );
};

export default MeetingEdit;
