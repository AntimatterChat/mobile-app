// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useNavigation} from 'expo-router';
import React, {useCallback, useEffect, useState} from 'react';
import {useIntl} from 'react-intl';
import {Alert, View} from 'react-native';

import {setThreadTitle} from '@actions/remote/thread_title';
import FloatingTextInput from '@components/floating_input/floating_text_input_label';
import FormattedText from '@components/formatted_text';
import NavigationButton from '@components/navigation_button';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import {usePreventDoubleTap} from '@hooks/utils';
import {navigateBack} from '@screens/navigation';
import {getFullErrorMessage} from '@utils/errors';
import {dismissKeyboard} from '@utils/keyboard';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {MAX_THREAD_TITLE_LENGTH} from '@utils/thread_title';
import {typography} from '@utils/typography';

export type Props = {
    rootId: string;
    currentTitle: string;
}

const close = () => {
    dismissKeyboard();
    navigateBack();
};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flex: 1,
        gap: 16,
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    lead: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 100),
    },
}));

// NameThread makes a thread a topic by naming it, renames a topic, or makes it a plain thread again when its name is
// left empty, as Fusion's topic dialog. (Topics were "named threads": the data keeps the thread title name.)
export default function NameThread({rootId, currentTitle}: Props) {
    const navigation = useNavigation();
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const [title, setTitle] = useState(currentTitle);
    const canSave = title.trim() !== currentTitle;

    const save = usePreventDoubleTap(useCallback(async () => {
        if (!canSave) {
            return;
        }
        const {error} = await setThreadTitle(serverUrl, rootId, title);
        if (error) {
            Alert.alert(
                intl.formatMessage({id: 'name_thread.error', defaultMessage: 'The topic couldn\'t be saved'}),
                getFullErrorMessage(error),
            );
            return;
        }
        close();
    }, [canSave, serverUrl, rootId, title, intl]));

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <NavigationButton
                    onPress={save}
                    testID='name_thread.save.button'
                    text={intl.formatMessage({id: 'name_thread.save', defaultMessage: 'Save'})}
                    disabled={!canSave}
                />
            ),
        });
    }, [canSave, intl, navigation, save]);

    useAndroidHardwareBackHandler(Screens.NAME_THREAD, close);

    return (
        <View style={styles.container}>
            <FormattedText
                id='name_thread.lead'
                defaultMessage='A topic is a named conversation inside its channel: its name shows in the thread, in the threads list and under its first message.'
                style={styles.lead}
            />
            {Boolean(currentTitle) && (
                <FormattedText
                    id='name_thread.lead_rename'
                    defaultMessage='Leave the name empty to make it a plain thread again.'
                    style={styles.lead}
                    testID='name_thread.lead_rename'
                />
            )}
            <FloatingTextInput
                label={intl.formatMessage({id: 'name_thread.name', defaultMessage: 'Name'})}
                placeholder={intl.formatMessage({id: 'name_thread.placeholder', defaultMessage: 'e.g. Release 2.1'})}
                onChangeText={setTitle}
                maxLength={MAX_THREAD_TITLE_LENGTH}
                testID='name_thread.input'
                value={title}
                theme={theme}
                autoFocus={true}
                returnKeyType='done'
                onSubmitEditing={save}
            />
        </View>
    );
}
