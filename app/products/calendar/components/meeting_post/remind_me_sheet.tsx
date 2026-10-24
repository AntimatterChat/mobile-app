// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {Alert, View} from 'react-native';

import FormattedText from '@components/formatted_text';
import SlideUpPanelItem, {ITEM_HEIGHT} from '@components/slide_up_panel_item';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {dismissBottomSheet} from '@screens/navigation';
import {getFullErrorMessage} from '@utils/errors';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {setMeetingReminder} from '../../actions/remote/meetings';
import {reminderChoicesWithDefault} from '../../utils/reminder';

import type {Meeting} from '../../types/calendar';

const messages = defineMessages({
    title: {id: 'calendar.remind_me.title', defaultMessage: 'Remind me'},
    failed: {id: 'calendar.remind_me.failed', defaultMessage: 'The reminder couldn\'t be saved: {error}'},
});

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    listHeader: {
        marginBottom: 12,
    },
    listHeaderText: {
        color: theme.centerChannelColor,
        ...typography('Heading', 600, 'SemiBold'),
    },
    label: {
        color: theme.centerChannelColor,
        ...typography('Body', 200),
    },
}));

export {ITEM_HEIGHT};

type Props = {
    meeting: Meeting;
    onChanged: (meeting: Meeting) => void;
};

const RemindMeSheet = ({meeting, onChanged}: Props) => {
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const choices = reminderChoicesWithDefault(meeting.reminder_minutes, intl);
    const selected = meeting.my_reminder_override ?? null;

    const onSelect = useCallback(async (minutes: number | null) => {
        await dismissBottomSheet();
        const result = await setMeetingReminder(serverUrl, meeting.id, minutes);
        if (result.error) {
            Alert.alert('', intl.formatMessage(messages.failed, {error: getFullErrorMessage(result.error)}));
            return;
        }
        if (result.data) {
            onChanged(result.data);
        }
    }, [serverUrl, meeting.id, intl, onChanged]);

    return (
        <View testID='calendar.remind_me_sheet'>
            <View style={styles.listHeader}>
                <FormattedText
                    id={messages.title.id}
                    defaultMessage={messages.title.defaultMessage}
                    style={styles.listHeaderText}
                />
            </View>
            {choices.map((choice) => (
                <SlideUpPanelItem
                    key={String(choice.minutes)}
                    onPress={() => onSelect(choice.minutes)}
                    rightIcon={choice.minutes === selected ? 'check' : undefined}
                    testID={`calendar.remind_me_sheet.option.${choice.minutes}`}
                    text={choice.label}
                    textStyles={styles.label}
                />
            ))}
        </View>
    );
};

export default RemindMeSheet;
