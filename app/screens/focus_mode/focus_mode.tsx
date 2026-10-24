// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {Moment} from 'moment-timezone';
import React, {useCallback, useMemo, useState} from 'react';
import {useIntl} from 'react-intl';
import {Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {startFocus} from '@actions/remote/focus';
import Button from '@components/button';
import DateTimePicker from '@components/date_time_selector';
import FormattedText from '@components/formatted_text';
import OptionItem from '@components/option_item';
import {Screens} from '@constants';
import {FOCUS_DURATIONS, FOCUS_MAX_DURATION_MS, FOCUS_MIN_DURATION_MS, FOCUS_REASON_MAX} from '@constants/focus';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import BottomSheet from '@screens/bottom_sheet';
import {dismissBottomSheet} from '@screens/navigation';
import {tomorrowAt9} from '@utils/focus';
import {bottomSheetSnapPoint} from '@utils/helpers';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';
import {getTimezone} from '@utils/user';

import type UserModel from '@typings/database/models/servers/user';

export type FocusModeProps = {
    currentUser?: UserModel;
};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        backgroundColor: theme.centerChannelBg,
        paddingHorizontal: 16,
    },
    title: {
        color: theme.centerChannelColor,
        ...typography('Heading', 600, 'SemiBold'),
        marginBottom: 8,
    },
    lead: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 200, 'Regular'),
        marginBottom: 12,
    },
    end: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75, 'Regular'),
        marginTop: 4,
        marginBottom: 12,
    },
    reasonLabel: {
        color: theme.centerChannelColor,
        ...typography('Body', 75, 'SemiBold'),
        marginBottom: 6,
    },
    reasonInput: {
        borderWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.16),
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: theme.centerChannelColor,
        ...typography('Body', 200, 'Regular'),
        marginBottom: 12,
    },
    error: {
        color: theme.errorTextColor,
        ...typography('Body', 75, 'Regular'),
        marginBottom: 12,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    button: {
        flex: 1,
    },
}));

const ITEM_HEIGHT = 48;

const FocusMode = ({currentUser}: FocusModeProps) => {
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const {bottom} = useSafeAreaInsets();
    const styles = getStyleSheet(theme);
    const zone = getTimezone(currentUser?.timezone);

    const [choiceKey, setChoiceKey] = useState('1h');
    const [customDate, setCustomDate] = useState<Moment | undefined>();
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const picked = useMemo(() => FOCUS_DURATIONS.find((d) => d.key === choiceKey) || FOCUS_DURATIONS[2], [choiceKey]);

    const end = useMemo(() => {
        if (picked.minutes) {
            return Date.now() + (picked.minutes * 60000);
        }
        if (picked.key === 'tomorrow') {
            return tomorrowAt9(zone);
        }
        if (picked.key === 'custom' && customDate) {
            const at = customDate.valueOf();
            const left = at - Date.now();
            return (left >= FOCUS_MIN_DURATION_MS && left <= FOCUS_MAX_DURATION_MS) ? at : 0;
        }
        return 0;
    }, [picked, customDate, zone]);

    const close = useCallback(() => {
        return dismissBottomSheet();
    }, []);

    const labelOf = useCallback((key: string) => {
        switch (key) {
            case '15m': return intl.formatMessage({id: 'focus_mode.for15m', defaultMessage: '15 min'});
            case '30m': return intl.formatMessage({id: 'focus_mode.for30m', defaultMessage: '30 min'});
            case '1h': return intl.formatMessage({id: 'focus_mode.for1h', defaultMessage: '1 h'});
            case '2h': return intl.formatMessage({id: 'focus_mode.for2h', defaultMessage: '2 h'});
            case '3h': return intl.formatMessage({id: 'focus_mode.for3h', defaultMessage: '3 h'});
            case '4h': return intl.formatMessage({id: 'focus_mode.for4h', defaultMessage: '4 h'});
            case '5h': return intl.formatMessage({id: 'focus_mode.for5h', defaultMessage: '5 h'});
            case '6h': return intl.formatMessage({id: 'focus_mode.for6h', defaultMessage: '6 h'});
            case 'tomorrow': return intl.formatMessage({id: 'focus_mode.tomorrow', defaultMessage: 'Until tomorrow'});
            default: return intl.formatMessage({id: 'focus_mode.custom', defaultMessage: 'Custom'});
        }
    }, [intl]);

    const submit = useCallback(async () => {
        if (busy || !end) {
            return;
        }
        setBusy(true);
        setError('');
        const request: FocusRequest = picked.duration ? {duration: picked.duration, reason: reason.trim()} : {end_at: end, reason: reason.trim()};
        const {error: submitError} = await startFocus(serverUrl, request);
        if (submitError) {
            setBusy(false);
            setError(intl.formatMessage({id: 'focus_mode.failed', defaultMessage: 'Focus mode couldn\'t be started.'}));
            return;
        }
        close();
    }, [busy, end, picked, reason, serverUrl, intl, close]);

    const renderContent = () => (
        <View style={[styles.container, {paddingBottom: bottom}]}>
            <FormattedText
                id='focus_mode.title'
                defaultMessage='Focus mode'
                style={styles.title}
            />
            <FormattedText
                id='focus_mode.lead'
                defaultMessage='Do not disturb for a while: notifications are muted and your unread badges hide. When it ends, you see what you missed.'
                style={styles.lead}
            />
            {FOCUS_DURATIONS.map((d) => (
                <OptionItem
                    key={d.key}
                    type='select'
                    label={labelOf(d.key)}
                    selected={choiceKey === d.key}
                    value={d.key}
                    action={(value: string | boolean) => setChoiceKey(value as string)}
                    testID={`focus_mode.duration.${d.key}`}
                />
            ))}
            {choiceKey === 'custom' && (
                <DateTimePicker
                    handleChange={setCustomDate}
                    theme={theme}
                    timezone={zone}
                    testID='focus_mode.custom_date'
                />
            )}
            <Text style={styles.end}>
                {end ? intl.formatMessage({id: 'focus_mode.until', defaultMessage: 'Until {time}'}, {time: intl.formatTime(end)}) : intl.formatMessage({id: 'focus_mode.custom_invalid', defaultMessage: 'Choose a time from a minute to a week from now.'})}
            </Text>
            <Text style={styles.reasonLabel}>
                {intl.formatMessage({id: 'focus_mode.reason', defaultMessage: 'Reason (optional)'})}
            </Text>
            <TextInput
                testID='focus_mode.reason.input'
                style={styles.reasonInput}
                value={reason}
                onChangeText={setReason}
                maxLength={FOCUS_REASON_MAX}
                placeholder={intl.formatMessage({id: 'focus_mode.reason_placeholder', defaultMessage: 'Working on the new release'})}
                placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.5)}
            />
            {Boolean(error) && (
                <Text style={styles.error}>{error}</Text>
            )}
            <View style={styles.buttons}>
                <Button
                    theme={theme}
                    text={intl.formatMessage({id: 'focus_mode.cancel', defaultMessage: 'Cancel'})}
                    emphasis='tertiary'
                    onPress={close}
                    buttonContainerStyle={styles.button}
                    testID='focus_mode.cancel.button'
                />
                <Button
                    theme={theme}
                    text={intl.formatMessage({id: 'focus_mode.start', defaultMessage: 'Start'})}
                    onPress={submit}
                    disabled={busy || !end}
                    showLoader={busy}
                    buttonContainerStyle={styles.button}
                    testID='focus_mode.start.button'
                />
            </View>
        </View>
    );

    const snapPoint = bottomSheetSnapPoint(FOCUS_DURATIONS.length + 6, ITEM_HEIGHT);

    return (
        <BottomSheet
            renderContent={renderContent}
            screen={Screens.FOCUS_MODE}
            initialSnapIndex={1}
            snapPoints={[1, snapPoint]}
            testID='focus_mode'
        />
    );
};

export default FocusMode;
