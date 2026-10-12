// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {openBrowserAsync} from 'expo-web-browser';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {Pressable, Text, View} from 'react-native';

import Button from '@components/button';
import CompassIcon from '@components/compass_icon';
import ExpoImage from '@components/expo_image';
import FormattedText from '@components/formatted_text';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import DatabaseManager from '@database/manager';
import NetworkManager from '@managers/network_manager';
import {getChannelById} from '@queries/servers/channel';
import {getCurrentTeam, getTeamById} from '@queries/servers/team';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {NOTES_PLUGIN_ID, WHITEBOARD_PLUGIN_ID} from '../../constants';
import {timeAgo} from '../../utils/time';

import type {PluginDoc} from '../../types';
import type PostModel from '@typings/database/models/servers/post';

export type DocKind = 'note' | 'whiteboard';

const messages = defineMessages({
    noteLabel: {id: 'am_plugins.notes.card_label', defaultMessage: 'Shared note'},
    noteOpen: {id: 'am_plugins.notes.open', defaultMessage: 'Open note'},
    noteUnavailable: {id: 'am_plugins.notes.unavailable', defaultMessage: 'This note was deleted, or you are not a member of its channel.'},
    boardLabel: {id: 'am_plugins.whiteboard.card_label', defaultMessage: 'Shared whiteboard'},
    boardOpen: {id: 'am_plugins.whiteboard.open', defaultMessage: 'Open board'},
    boardUnavailable: {id: 'am_plugins.whiteboard.unavailable', defaultMessage: 'This board was deleted, or you are not a member of its channel.'},
    edited: {id: 'am_plugins.docs.edited', defaultMessage: 'Edited {when}'},
});

const KINDS = {
    note: {pluginId: NOTES_PLUGIN_ID, icon: 'file-text-outline', label: messages.noteLabel, open: messages.noteOpen, unavailable: messages.noteUnavailable},
    whiteboard: {pluginId: WHITEBOARD_PLUGIN_ID, icon: 'draw', label: messages.boardLabel, open: messages.boardOpen, unavailable: messages.boardUnavailable},
} as const;

// How long a loaded document is reused by the cards, as in the plugins' web cards.
const DOC_CACHE_MS = 60000;
const docs = new Map<string, {doc: Promise<PluginDoc | null>; at: number}>();

function loadDoc(serverUrl: string, kind: DocKind, docId: string) {
    const key = `${serverUrl}|${kind}|${docId}`;
    const cached = docs.get(key);
    if (cached && Date.now() - cached.at < DOC_CACHE_MS) {
        return cached.doc;
    }
    const doc = (async () => {
        try {
            const client = NetworkManager.getClient(serverUrl);
            return await client.getPluginDoc(KINDS[kind].pluginId, docId);
        } catch (error) {
            logDebug('error on loading a plugin document', getFullErrorMessage(error));
            return null;
        }
    })();
    docs.set(key, {doc, at: Date.now()});
    return doc;
}

// webPermalink is the address of a post in the web app, where the plugins open their documents
// from the post's card.
export async function webPermalink(serverUrl: string, post: PostModel) {
    const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
    const channel = await getChannelById(database, post.channelId);
    const team = channel?.teamId ? await getTeamById(database, channel.teamId) : await getCurrentTeam(database);
    return `${serverUrl}/${team?.name ?? ''}/pl/${post.id}`;
}

const THUMBNAIL_HEIGHT = 160;

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    card: {
        borderWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.16),
        borderRadius: 8,
        padding: 12,
        gap: 8,
        backgroundColor: theme.centerChannelBg,
    },
    label: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    labelText: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75, 'SemiBold'),
    },
    title: {
        color: theme.centerChannelColor,
        ...typography('Heading', 200, 'SemiBold'),
    },
    thumbnail: {
        height: THUMBNAIL_HEIGHT,
        borderRadius: 4,
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.04),
    },
    foot: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75),
    },
    actions: {
        flexDirection: 'row',
    },
    pressed: {
        opacity: 0.72,
    },
}));

type Props = {
    kind: DocKind;
    post: PostModel;
};

// DocCard is the card of a note or whiteboard shared in a channel (notes and whiteboard plugins):
// its title, the whiteboard's thumbnail, when it was last edited, and opening it. The documents are
// collaborative Yjs editors the app has no native version of, so "Open" shows the message in the
// web app, whose card opens the document.
const DocCard = ({kind, post}: Props) => {
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const config = KINDS[kind];
    const docId = typeof post.props?.doc_id === 'string' ? post.props.doc_id : '';
    const [doc, setDoc] = useState<PluginDoc | null | undefined>();
    const [thumbnailFailed, setThumbnailFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        if (docId) {
            loadDoc(serverUrl, kind, docId).then((d) => !cancelled && setDoc(d));
        } else {
            setDoc(null);
        }
        return () => {
            cancelled = true;
        };
    }, [serverUrl, kind, docId]);

    const thumbnail = useMemo(() => {
        if (kind !== 'whiteboard' || !doc) {
            return undefined;
        }
        try {
            const client = NetworkManager.getClient(serverUrl);
            return {
                uri: client.getWhiteboardThumbnailUrl(doc.id, doc.update_at),
                headers: client.getRequestHeaders('GET'),
            };
        } catch {
            return undefined;
        }
    }, [kind, doc, serverUrl]);

    const onOpen = useCallback(async () => {
        try {
            await openBrowserAsync(await webPermalink(serverUrl, post));
        } catch (error) {
            logDebug('error on opening a plugin document', getFullErrorMessage(error));
        }
    }, [serverUrl, post]);

    const title = doc?.title || (typeof post.props?.title === 'string' ? post.props.title : '');
    const available = doc !== null;

    return (
        <View
            style={styles.card}
            testID={`doc_card.${kind}`}
        >
            <View style={styles.label}>
                <CompassIcon
                    name={config.icon}
                    size={16}
                    color={changeOpacity(theme.centerChannelColor, 0.64)}
                />
                <FormattedText
                    {...config.label}
                    style={styles.labelText}
                />
            </View>
            <Pressable
                disabled={!available}
                onPress={onOpen}
                style={({pressed}) => pressed && styles.pressed}
            >
                <Text style={styles.title}>{title}</Text>
            </Pressable>
            {thumbnail && !thumbnailFailed && (
                <Pressable
                    onPress={onOpen}
                    style={({pressed}) => pressed && styles.pressed}
                >
                    <ExpoImage
                        cachePolicy='memory'
                        source={thumbnail}
                        style={styles.thumbnail}
                        contentFit='contain'
                        onError={() => setThumbnailFailed(true)}
                        accessibilityLabel={title}
                    />
                </Pressable>
            )}
            {doc === null && (
                <FormattedText
                    {...config.unavailable}
                    style={styles.foot}
                />
            )}
            {doc ? (
                <Text style={styles.foot}>
                    {intl.formatMessage(messages.edited, {when: intl.formatRelativeTime(...timeAgo(doc.update_at))})}
                </Text>
            ) : null}
            {available && (
                <View style={styles.actions}>
                    <Button
                        theme={theme}
                        size='s'
                        emphasis='primary'
                        text={intl.formatMessage(config.open)}
                        iconName='open-in-new'
                        onPress={onOpen}
                        testID={`doc_card.${kind}.open`}
                    />
                </View>
            )}
        </View>
    );
};

export default DocCard;
