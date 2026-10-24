// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo, useState} from 'react';
import {useIntl} from 'react-intl';
import {Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import Button from '@components/button';
import FormattedText from '@components/formatted_text';
import OptionItem from '@components/option_item';
import {Screens} from '@constants';
import {BURN_DEFAULT_MAXIMUM_DURATION_SECONDS} from '@constants/post';
import {useTheme} from '@context/theme';
import BottomSheet from '@screens/bottom_sheet';
import {dismissBottomSheet} from '@screens/navigation';
import CallbackStore from '@store/callback_store';
import {burnDurationSteps, clampBurnDurationSeconds, formatBurnDuration} from '@utils/burn_duration';
import {bottomSheetSnapPoint} from '@utils/helpers';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

export type BurnDurationPickerProps = {
    postBoRConfig: PostBoRConfig;
    defaultBorConfig: PostBoRConfig;
};

const ITEM_HEIGHT = 48;

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
    customRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
        marginBottom: 8,
    },
    customInput: {
        borderWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.16),
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: theme.centerChannelColor,
        ...typography('Body', 200, 'Regular'),
        width: 72,
    },
    customUnit: {
        color: theme.centerChannelColor,
        ...typography('Body', 200, 'Regular'),
    },
    limit: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75, 'Regular'),
        marginBottom: 12,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
        marginBottom: 12,
    },
    button: {
        flex: 1,
    },
}));

const BurnDurationPicker = ({postBoRConfig, defaultBorConfig}: BurnDurationPickerProps) => {
    const intl = useIntl();
    const theme = useTheme();
    const {bottom} = useSafeAreaInsets();
    const styles = getStyleSheet(theme);

    const limit = postBoRConfig.borMaximumDurationSeconds || defaultBorConfig.borMaximumDurationSeconds || BURN_DEFAULT_MAXIMUM_DURATION_SECONDS;
    const steps = useMemo(() => burnDurationSteps(limit), [limit]);
    const initialSeconds = postBoRConfig.durationSeconds ?? postBoRConfig.borDurationSeconds;

    const [enabled, setEnabled] = useState(Boolean(postBoRConfig.enabled));
    const [custom, setCustom] = useState(() => Boolean(postBoRConfig.enabled) && !steps.includes(initialSeconds));
    const [seconds, setSeconds] = useState(() => clampBurnDurationSeconds(initialSeconds, limit));
    const [customMinutes, setCustomMinutes] = useState(() => String(Math.max(1, Math.round(initialSeconds / 60))));

    const close = useCallback(() => dismissBottomSheet(), []);

    const choose = useCallback((value: number) => {
        setEnabled(true);
        setCustom(false);
        setSeconds(value);
    }, []);

    const chooseCustom = useCallback(() => {
        setEnabled(true);
        setCustom(true);
    }, []);

    const chooseOff = useCallback(() => {
        setEnabled(false);
        setCustom(false);
    }, []);

    const onCustomMinutesChange = useCallback((text: string) => {
        setCustomMinutes(text);
        const minutes = parseInt(text, 10);
        if (Number.isFinite(minutes) && minutes > 0) {
            setSeconds(clampBurnDurationSeconds(minutes * 60, limit));
        }
    }, [limit]);

    const submit = useCallback(() => {
        const callback = CallbackStore.getCallback<((config: PostBoRConfig) => void)>();
        callback?.({
            ...defaultBorConfig,
            enabled,
            durationSeconds: enabled ? seconds : postBoRConfig.durationSeconds,
        });
        close();
    }, [defaultBorConfig, enabled, seconds, postBoRConfig.durationSeconds, close]);

    const renderContent = () => (
        <View style={[styles.container, {paddingBottom: bottom}]}>
            <FormattedText
                id='burn_duration.title'
                defaultMessage='Burn on read'
                style={styles.title}
            />
            <OptionItem
                type='select'
                label={intl.formatMessage({id: 'burn_duration.off', defaultMessage: 'Off'})}
                selected={!enabled}
                value='off'
                action={chooseOff}
                testID='burn_duration_picker.off'
            />
            {steps.map((step) => (
                <OptionItem
                    key={step}
                    type='select'
                    label={formatBurnDuration(step, intl)}
                    selected={enabled && !custom && seconds === step}
                    value={String(step)}
                    action={() => choose(step)}
                    testID={`burn_duration_picker.${step}`}
                />
            ))}
            <OptionItem
                type='select'
                label={intl.formatMessage({id: 'burn_duration.custom', defaultMessage: 'Custom'})}
                selected={enabled && custom}
                value='custom'
                action={chooseCustom}
                testID='burn_duration_picker.custom'
            />
            {custom && (
                <View style={styles.customRow}>
                    <TextInput
                        testID='burn_duration_picker.custom.input'
                        style={styles.customInput}
                        value={customMinutes}
                        onChangeText={onCustomMinutesChange}
                        keyboardType='number-pad'
                    />
                    <Text style={styles.customUnit}>
                        {intl.formatMessage({id: 'burn_duration.minutes', defaultMessage: '{count, plural, one {# minute} other {# minutes}}'}, {count: Math.round(seconds / 60)})}
                    </Text>
                </View>
            )}
            <Text style={styles.limit}>
                {intl.formatMessage({id: 'burn_duration.up_to', defaultMessage: 'Up to {max}'}, {max: formatBurnDuration(limit, intl)})}
            </Text>
            <View style={styles.buttons}>
                <Button
                    theme={theme}
                    text={intl.formatMessage({id: 'burn_duration.cancel', defaultMessage: 'Cancel'})}
                    emphasis='tertiary'
                    onPress={close}
                    buttonContainerStyle={styles.button}
                    testID='burn_duration_picker.cancel.button'
                />
                <Button
                    theme={theme}
                    text={intl.formatMessage({id: 'burn_duration.apply', defaultMessage: 'Apply'})}
                    onPress={submit}
                    buttonContainerStyle={styles.button}
                    testID='burn_duration_picker.apply.button'
                />
            </View>
        </View>
    );

    const snapPoint = bottomSheetSnapPoint(steps.length + 8, ITEM_HEIGHT);

    return (
        <BottomSheet
            renderContent={renderContent}
            screen={Screens.BURN_DURATION_PICKER}
            initialSnapIndex={1}
            snapPoints={[1, snapPoint]}
            testID='burn_duration_picker'
        />
    );
};

export default BurnDurationPicker;
