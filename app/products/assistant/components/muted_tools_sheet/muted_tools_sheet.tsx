// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {Text, View} from 'react-native';

import {fetchMutedAssistantTools, unmuteAssistantTool} from '@assistant/actions/remote/feed';
import {assistantStore} from '@assistant/store';
import Button from '@components/button';
import FormattedText from '@components/formatted_text';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

const messages = defineMessages({
    title: {id: 'assistant.muted_tools.title', defaultMessage: 'Muted tools'},
    empty: {id: 'assistant.muted_tools.empty', defaultMessage: 'You haven\'t muted any tools.'},
    unmute: {id: 'assistant.muted_tools.unmute', defaultMessage: 'Unmute'},
});

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    title: {
        color: theme.centerChannelColor,
        marginBottom: 12,
        ...typography('Heading', 600, 'SemiBold'),
    },
    empty: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 200),
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    tool: {
        flex: 1,
        color: theme.centerChannelColor,
        ...typography('Body', 200),
    },
}));

const MutedToolsSheet = () => {
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);

    const [tools, setTools] = useState<string[]>(() => assistantStore.getMutedTools(serverUrl));

    useEffect(() => {
        fetchMutedAssistantTools(serverUrl);
        const sub = assistantStore.observeMutedTools(serverUrl).subscribe(setTools);
        return () => sub.unsubscribe();
    }, [serverUrl]);

    const onUnmute = useCallback((tool: string) => {
        unmuteAssistantTool(serverUrl, tool);
    }, [serverUrl]);

    return (
        <View testID='assistant.muted_tools_sheet'>
            <FormattedText
                id={messages.title.id}
                defaultMessage={messages.title.defaultMessage}
                style={styles.title}
            />
            {tools.length === 0 && (
                <FormattedText
                    id={messages.empty.id}
                    defaultMessage={messages.empty.defaultMessage}
                    style={styles.empty}
                    testID='assistant.muted_tools_sheet.empty'
                />
            )}
            {tools.map((tool) => (
                <View
                    key={tool}
                    style={styles.row}
                    testID={`assistant.muted_tools_sheet.row.${tool}`}
                >
                    <Text style={styles.tool}>{tool}</Text>
                    <Button
                        theme={theme}
                        size='s'
                        emphasis='tertiary'
                        text={intl.formatMessage(messages.unmute)}
                        onPress={() => onUnmute(tool)}
                        testID={`assistant.muted_tools_sheet.unmute.${tool}`}
                    />
                </View>
            ))}
        </View>
    );
};

export default MutedToolsSheet;
