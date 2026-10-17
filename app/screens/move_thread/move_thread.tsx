// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useIntl} from 'react-intl';
import {Alert, FlatList, Text, View, type ListRenderItemInfo} from 'react-native';

import {switchToChannelById} from '@actions/remote/channel';
import {moveThread} from '@actions/remote/move_thread';
import {fetchPostThread} from '@actions/remote/post';
import ChannelItem from '@components/channel_item';
import Loading from '@components/loading';
import OptionItem from '@components/option_item';
import Search from '@components/search';
import {General, Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import {usePreventDoubleTap} from '@hooks/utils';
import {navigateBack} from '@screens/navigation';
import {getErrorMessage} from '@utils/errors';
import {filterMoveTargets, isThreadMine, type MoveThreadTarget} from '@utils/move_thread';
import {changeOpacity, getKeyboardAppearanceFromTheme, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import type ChannelModel from '@typings/database/models/servers/channel';
import type PostModel from '@typings/database/models/servers/post';
import type UserModel from '@typings/database/models/servers/user';

export type Props = {

    // The thread's first message, and the channel it is in.
    rootId: string;
    channelId: string;
}

type EnhancedProps = Props & {
    root?: PostModel;
    source?: ChannelModel;
    currentUser?: UserModel;
    isModerator: boolean;
    targets: Array<MoveThreadTarget<ChannelModel>>;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flex: 1,
    },
    header: {
        gap: 12,
        paddingTop: 16,
        paddingBottom: 8,
    },
    lead: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 100),
    },
    note: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75),
    },
    empty: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        paddingVertical: 24,
        textAlign: 'center',
        ...typography('Body', 100),
    },
    list: {
        paddingHorizontal: 20,
    },
}));

const keyExtractor = (channel: ChannelModel) => channel.id;

// matchesTerm says whether a channel's name or display name contains term (typed with or without # or ~).
export function matchesTerm(channel: ChannelModel, term: string) {
    const t = term.trim().toLowerCase().replace(/^[#~]/, '');
    return !t || channel.displayName.toLowerCase().includes(t) || channel.name.toLowerCase().includes(t);
}

// MoveThread moves a thread to another channel of its community, as Fusion's "Move thread" dialog does: it lists the
// channels the thread may move to (see @utils/move_thread), and asks to confirm. With "Post replies as separate
// messages", the replies become messages of the channel instead of a thread.
export default function MoveThread({rootId, root, source, currentUser, isModerator, targets}: EnhancedProps) {
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const [term, setTerm] = useState('');
    const [flatten, setFlatten] = useState(false);

    // Whether every message of the thread is the current user's, once the whole thread is loaded (undefined until).
    const [threadIsMine, setThreadIsMine] = useState<boolean | undefined>(undefined);
    const userId = currentUser?.id || '';

    useEffect(() => {
        let cancelled = false;
        fetchPostThread(serverUrl, rootId, {fetchAll: true}, true).then(({posts}) => {
            if (!cancelled) {
                setThreadIsMine(posts ? isThreadMine(userId, posts) : false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [serverUrl, rootId, userId]);

    const channels = useMemo(() => {
        const allowed = filterMoveTargets(root, source, targets, {userId, isModerator, threadIsMine: Boolean(threadIsMine)});
        return allowed.
            filter((c) => matchesTerm(c, term)).
            sort((a, b) => a.displayName.localeCompare(b.displayName, intl.locale));
    }, [root, source, targets, userId, isModerator, threadIsMine, term, intl.locale]);

    // An author who isn't a moderator, of a thread others replied to: public channels only, or nowhere from a private one.
    const othersReplied = !isModerator && threadIsMine === false;
    const fromPrivate = source?.type === General.PRIVATE_CHANNEL;

    const move = usePreventDoubleTap(useCallback(async (target: ChannelModel) => {
        const {error} = await moveThread(serverUrl, rootId, target.id, flatten);
        if (error) {
            Alert.alert(
                intl.formatMessage({id: 'move_thread.error', defaultMessage: 'The thread couldn\'t be moved'}),
                getErrorMessage(error, intl),
            );
            return;
        }
        await navigateBack();
        switchToChannelById(serverUrl, target.id);
    }, [serverUrl, rootId, flatten, intl]));

    const confirm = useCallback((target: ChannelModel | Channel) => {
        const channel = target as ChannelModel;
        const values = {channel: channel.displayName};
        Alert.alert(
            intl.formatMessage({id: 'move_thread.confirm.title', defaultMessage: 'Move the thread?'}),
            flatten ? intl.formatMessage({id: 'move_thread.confirm.message_flatten', defaultMessage: 'Its messages will move to #{channel}, its replies as separate messages. A link to them stays here.'}, values) : intl.formatMessage({id: 'move_thread.confirm.message', defaultMessage: 'Its messages will move to #{channel}. A link to them stays here.'}, values),
            [{
                text: intl.formatMessage({id: 'move_thread.confirm.cancel', defaultMessage: 'Cancel'}),
                style: 'cancel',
            }, {
                text: intl.formatMessage({id: 'move_thread.confirm.move', defaultMessage: 'Move'}),
                onPress: () => move(channel),
            }],
        );
    }, [flatten, intl, move]);

    useAndroidHardwareBackHandler(Screens.MOVE_THREAD, navigateBack);

    const renderItem = useCallback(({item}: ListRenderItemInfo<ChannelModel>) => (
        <ChannelItem
            channel={item}
            onPress={confirm}
            testID={`move_thread.channel.${item.name}`}
            isOnCenterBg={true}
            showChannelName={true}
        />
    ), [confirm]);

    let emptyText = intl.formatMessage({id: 'move_thread.no_channels', defaultMessage: 'There is no channel to move this thread to.'});
    if (othersReplied && fromPrivate) {
        emptyText = intl.formatMessage({id: 'move_thread.private_needs_moderator', defaultMessage: 'Others replied in this thread: only a moderator can move it out of a private channel.'});
    }

    const header = (
        <View style={styles.header}>
            <Text style={styles.lead}>
                {intl.formatMessage({id: 'move_thread.lead', defaultMessage: 'Choose the channel to move this thread to. Its messages keep their authors and times, and a link to them stays here.'})}
            </Text>
            <OptionItem
                action={(v) => setFlatten(Boolean(v))}
                label={intl.formatMessage({id: 'move_thread.flatten', defaultMessage: 'Post replies as separate messages'})}
                description={intl.formatMessage({id: 'move_thread.flatten_description', defaultMessage: 'The replies become messages of the channel instead of a thread.'})}
                selected={flatten}
                testID='move_thread.flatten.toggle'
                type='toggle'
            />
            {othersReplied && !fromPrivate && (
                <Text
                    style={styles.note}
                    testID='move_thread.public_only'
                >
                    {intl.formatMessage({id: 'move_thread.public_only', defaultMessage: 'Others replied in this thread: you can move it to public channels only. A moderator can move it anywhere.'})}
                </Text>
            )}
            <Search
                testID='move_thread.search_bar'
                placeholder={intl.formatMessage({id: 'move_thread.search', defaultMessage: 'Find a channel'})}
                cancelButtonTitle={intl.formatMessage({id: 'move_thread.confirm.cancel', defaultMessage: 'Cancel'})}
                placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.5)}
                onChangeText={setTerm}
                onCancel={() => setTerm('')}
                autoCapitalize='none'
                keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                value={term}
            />
        </View>
    );

    // Until the thread is loaded, an author who isn't a moderator may see too few channels.
    const loading = threadIsMine === undefined && !isModerator;

    return (
        <View
            style={styles.container}
            testID='move_thread.screen'
        >
            <FlatList
                data={channels}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                ListHeaderComponent={header}
                ListEmptyComponent={loading ? <Loading/> : (
                    <Text
                        style={styles.empty}
                        testID='move_thread.empty'
                    >
                        {emptyText}
                    </Text>
                )}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps='handled'
            />
        </View>
    );
}
