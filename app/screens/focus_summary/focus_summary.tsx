// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {useIntl} from 'react-intl';
import {Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {switchToChannelById} from '@actions/remote/channel';
import {fetchFocusSummary, markFocusSummaryRead, markFocusSummarySeen} from '@actions/remote/focus';
import {fetchAndSwitchToThread} from '@actions/remote/thread';
import Badge from '@components/badge';
import Button from '@components/button';
import FormattedText from '@components/formatted_text';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import BottomSheet from '@screens/bottom_sheet';
import {dismissBottomSheet} from '@screens/navigation';
import {bottomSheetSnapPoint} from '@utils/helpers';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

export type FocusSummaryProps = {
    startAt: number;
    endAt: number;
};

const ROW_HEIGHT = 56;

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
    sectionTitle: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Heading', 75, 'SemiBold'),
        marginTop: 12,
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: ROW_HEIGHT,
        gap: 8,
    },
    rowGrow: {
        flex: 1,
    },
    rowTitle: {
        color: theme.centerChannelColor,
        ...typography('Body', 200, 'SemiBold'),
    },
    rowDetail: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75, 'Regular'),
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
        marginBottom: 12,
    },
    button: {
        flex: 1,
    },
}));

function ChannelRow({item, onOpen}: {item: FocusSummaryChannel; onOpen: (item: FocusSummaryChannel) => void}) {
    const {formatMessage} = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const isDirect = item.type === 'D' || item.type === 'G';
    const name = isDirect ? item.display_name : `#${item.display_name}`;
    const count = item.count >= 1000 ? '999+' : String(item.count);

    return (
        <TouchableOpacity
            style={styles.row}
            onPress={() => onOpen(item)}
            testID={`focus_summary.channel.${item.channel_id}`}
        >
            <View style={styles.rowGrow}>
                <Text style={styles.rowTitle}>{name}</Text>
                <Text style={styles.rowDetail}>
                    {formatMessage({id: 'focus_summary.count', defaultMessage: '{count, plural, one {# new message} other {{shown} new messages}}'}, {count: item.count, shown: count})}
                </Text>
            </View>
            {item.mention_count > 0 && <Badge value={item.mention_count} visible={true}/>}
        </TouchableOpacity>
    );
}

function ThreadRow({item, onOpen}: {item: FocusSummaryThread; onOpen: (item: FocusSummaryThread) => void}) {
    const {formatMessage} = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const count = item.count >= 1000 ? '999+' : String(item.count);

    return (
        <TouchableOpacity
            style={styles.row}
            onPress={() => onOpen(item)}
            testID={`focus_summary.thread.${item.post_id}`}
        >
            <View style={styles.rowGrow}>
                <Text style={styles.rowTitle}>
                    {formatMessage({id: 'focus_summary.thread', defaultMessage: 'Thread'})}
                </Text>
                <Text style={styles.rowDetail}>
                    {formatMessage({id: 'focus_summary.replies', defaultMessage: '{count, plural, one {# new reply} other {{shown} new replies}}'}, {count: item.count, shown: count})}
                </Text>
            </View>
            {item.mention_count > 0 && <Badge value={item.mention_count} visible={true}/>}
        </TouchableOpacity>
    );
}

const FocusSummaryScreen = ({startAt, endAt}: FocusSummaryProps) => {
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const {bottom} = useSafeAreaInsets();
    const styles = getStyleSheet(theme);
    const [summary, setSummary] = useState<FocusSummary | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let gone = false;
        fetchFocusSummary(serverUrl, startAt, endAt).then(({summary: found}) => {
            if (!gone && found) {
                setSummary(found);
            }
        });
        return () => {
            gone = true;
        };
    }, [serverUrl, startAt, endAt]);

    const close = useCallback(() => {
        return dismissBottomSheet();
    }, []);

    const done = useCallback(async (markRead: boolean) => {
        setBusy(true);
        if (markRead) {
            await markFocusSummaryRead(serverUrl, startAt, endAt);
        }
        await markFocusSummarySeen(serverUrl, startAt);
        await close();
    }, [serverUrl, startAt, endAt, close]);

    const openChannel = useCallback(async (item: FocusSummaryChannel) => {
        await close();
        switchToChannelById(serverUrl, item.channel_id, item.team_id);
    }, [serverUrl, close]);

    const openThread = useCallback(async (item: FocusSummaryThread) => {
        await close();
        fetchAndSwitchToThread(serverUrl, item.post_id);
    }, [serverUrl, close]);

    const direct = summary?.channels.filter((c) => c.type === 'D' || c.type === 'G') || [];
    const channels = summary?.channels.filter((c) => c.type !== 'D' && c.type !== 'G') || [];
    const threads = summary?.threads || [];

    const renderContent = () => (
        <View style={[styles.container, {paddingBottom: bottom}]}>
            <FormattedText
                id='focus_summary.title'
                defaultMessage='While you were focusing'
                style={styles.title}
            />
            <Text style={styles.lead}>
                {summary && summary.mention_count > 0 ? intl.formatMessage({id: 'focus_summary.lead_mentions', defaultMessage: '{count, plural, one {# mention waits} other {# mentions wait}} for you.'}, {count: summary.mention_count}) : intl.formatMessage({id: 'focus_summary.lead', defaultMessage: 'Here is what came in.'})}
            </Text>
            {direct.length > 0 && (
                <>
                    <FormattedText
                        id='focus_summary.direct'
                        defaultMessage='Direct messages'
                        style={styles.sectionTitle}
                    />
                    {direct.map((item) => (
                        <ChannelRow
                            key={item.channel_id}
                            item={item}
                            onOpen={openChannel}
                        />
                    ))}
                </>
            )}
            {channels.length > 0 && (
                <>
                    <FormattedText
                        id='focus_summary.channels'
                        defaultMessage='Channels'
                        style={styles.sectionTitle}
                    />
                    {channels.map((item) => (
                        <ChannelRow
                            key={item.channel_id}
                            item={item}
                            onOpen={openChannel}
                        />
                    ))}
                </>
            )}
            {threads.length > 0 && (
                <>
                    <FormattedText
                        id='focus_summary.threads'
                        defaultMessage='Threads'
                        style={styles.sectionTitle}
                    />
                    {threads.map((item) => (
                        <ThreadRow
                            key={item.post_id}
                            item={item}
                            onOpen={openThread}
                        />
                    ))}
                </>
            )}
            <View style={styles.buttons}>
                <Button
                    theme={theme}
                    text={intl.formatMessage({id: 'focus_summary.show_badges', defaultMessage: 'Show unread badges'})}
                    emphasis='tertiary'
                    onPress={() => done(false)}
                    disabled={busy}
                    buttonContainerStyle={styles.button}
                    testID='focus_summary.show_badges.button'
                />
                <Button
                    theme={theme}
                    text={intl.formatMessage({id: 'focus_summary.mark_all_read', defaultMessage: 'Mark all as read'})}
                    onPress={() => done(true)}
                    disabled={busy}
                    showLoader={busy}
                    buttonContainerStyle={styles.button}
                    testID='focus_summary.mark_all_read.button'
                />
            </View>
        </View>
    );

    const rows = direct.length + channels.length + threads.length;
    const snapPoint = bottomSheetSnapPoint(rows + 8, ROW_HEIGHT);

    return (
        <BottomSheet
            renderContent={renderContent}
            screen={Screens.FOCUS_SUMMARY}
            initialSnapIndex={1}
            snapPoints={[1, snapPoint]}
            testID='focus_summary'
        />
    );
};

export default FocusSummaryScreen;
