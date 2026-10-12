// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {FlatList, Keyboard, Pressable, Text, useWindowDimensions, View, type ListRenderItemInfo} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import FormattedText from '@components/formatted_text';
import Loading from '@components/loading';
import Search from '@components/search';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import {navigateBack} from '@screens/navigation';
import {getFullErrorMessage} from '@utils/errors';
import {changeOpacity, getKeyboardAppearanceFromTheme, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {fetchGifs, fetchGifsConfig, postGif} from '../../actions/remote/gifs';
import {GifMediaView} from '../../components/gif_post';

import type {GifItem, GifKind, GifsConfig} from '../../types';

export const messages = defineMessages({
    title: {id: 'am_plugins.gifs.picker.title', defaultMessage: 'GIFs and stickers'},
    tabGifs: {id: 'am_plugins.gifs.picker.tab_gifs', defaultMessage: 'GIFs'},
    tabStickers: {id: 'am_plugins.gifs.picker.tab_stickers', defaultMessage: 'Stickers'},
    searchGifs: {id: 'am_plugins.gifs.picker.search_gifs', defaultMessage: 'Search GIFs'},
    searchStickers: {id: 'am_plugins.gifs.picker.search_stickers', defaultMessage: 'Search stickers'},
    sendGif: {id: 'am_plugins.gifs.picker.send_gif', defaultMessage: 'Send GIF: {title}'},
    sendSticker: {id: 'am_plugins.gifs.picker.send_sticker', defaultMessage: 'Send sticker: {title}'},
    noGifs: {id: 'am_plugins.gifs.picker.no_gifs', defaultMessage: 'No GIFs match.'},
    noStickers: {id: 'am_plugins.gifs.picker.no_stickers', defaultMessage: 'No stickers match.'},
    loadFailed: {id: 'am_plugins.gifs.picker.load_failed', defaultMessage: 'The GIF service isn’t available right now.'},
    postFailed: {id: 'am_plugins.gifs.picker.post_failed', defaultMessage: 'Couldn’t send it: {error}'},
    notConfigured: {id: 'am_plugins.gifs.picker.not_configured', defaultMessage: 'GIFs aren’t set up yet: ask a system admin to configure the GIFs plugin.'},
    cancel: {id: 'am_plugins.gifs.picker.cancel', defaultMessage: 'Cancel'},
});

const SEARCH_DELAY_MS = 300;
const GAP = 6;
const PADDING = 12;
const COLUMNS: Record<GifKind, number> = {gif: 2, sticker: 3};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.centerChannelBg,
    },
    header: {
        paddingHorizontal: PADDING,
        paddingTop: 12,
        gap: 10,
    },
    tabs: {
        flexDirection: 'row',
        gap: 8,
    },
    tab: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
    },
    tabSelected: {
        backgroundColor: changeOpacity(theme.buttonBg, 0.16),
    },
    tabText: {
        color: changeOpacity(theme.centerChannelColor, 0.72),
        ...typography('Body', 100, 'SemiBold'),
    },
    tabTextSelected: {
        color: theme.buttonBg,
    },
    list: {
        padding: PADDING,
        gap: GAP,
    },
    row: {
        gap: GAP,
    },
    tile: {
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.04),
    },
    message: {
        padding: 24,
        textAlign: 'center',
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 100),
    },
    error: {
        paddingHorizontal: PADDING,
        paddingTop: 8,
        color: theme.errorTextColor,
        ...typography('Body', 100),
    },
    loading: {
        padding: 24,
    },
    pressed: {
        opacity: 0.72,
    },
}));

type TileProps = {
    item: GifItem;
    size: number;
    onPick: (item: GifItem) => void;
};

const Tile = ({item, size, onPick}: TileProps) => {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const onPress = useCallback(() => onPick(item), [item, onPick]);
    const title = item.title || item.description || '';
    const label = intl.formatMessage(item.kind === 'sticker' ? messages.sendSticker : messages.sendGif, {title});

    return (
        <Pressable
            accessibilityLabel={label}
            onPress={onPress}
            style={({pressed}) => [styles.tile, {width: size, height: size}, pressed && styles.pressed]}
            testID={`gif_picker.item.${item.id}`}
        >
            <GifMediaView
                media={item.preview}
                label={label}
                width={size}
                height={size}
                fit={item.kind === 'sticker' ? 'contain' : 'cover'}
            />
        </Pressable>
    );
};

export type GifPickerProps = {
    channelId: string;
    rootId?: string;
};

const SAFE_AREA_EDGES = ['bottom', 'left', 'right'] as const;

const keyExtractor = (item: GifItem) => `${item.kind}:${item.id}`;

// GifPicker finds GIFs and stickers with the GIFs plugin's search (its featured ones before a
// search) and sends the one picked to the channel or thread, as the plugin's web picker does.
const GifPicker = ({channelId, rootId}: GifPickerProps) => {
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const {width} = useWindowDimensions();
    const [config, setConfig] = useState<GifsConfig | null>();
    const [kind, setKind] = useState<GifKind>('gif');
    const [term, setTerm] = useState('');
    const [query, setQuery] = useState('');
    const [items, setItems] = useState<GifItem[]>([]);
    const [next, setNext] = useState<string>();
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);
    const request = useRef(0);

    const close = useCallback(() => {
        Keyboard.dismiss();
        navigateBack();
    }, []);
    useAndroidHardwareBackHandler(Screens.AM_GIF_PICKER, close);

    useEffect(() => {
        fetchGifsConfig(serverUrl).then(({config: c}) => setConfig(c ?? null));
    }, [serverUrl]);

    // The search runs once the typing pauses
    useEffect(() => {
        const timer = setTimeout(() => setQuery(term), SEARCH_DELAY_MS);
        return () => clearTimeout(timer);
    }, [term]);

    const load = useCallback(async (pos?: string) => {
        const id = ++request.current;
        setLoading(true);
        setFailed(false);
        const {page} = await fetchGifs(serverUrl, kind, query, pos);
        if (id !== request.current) {
            return;
        }
        setLoading(false);
        if (!page) {
            setFailed(true);
            return;
        }
        setItems((current) => (pos ? [...current, ...page.items] : page.items));
        setNext(page.next || undefined);
    }, [serverUrl, kind, query]);

    useEffect(() => {
        if (config?.configured) {
            setItems([]);
            setNext(undefined);
            load();
        }
    }, [config, load]);

    const onEndReached = useCallback(() => {
        if (next && !loading) {
            load(next);
        }
    }, [next, loading, load]);

    const onPick = useCallback(async (item: GifItem) => {
        if (sending) {
            return;
        }
        setSending(true);
        setError('');
        const result = await postGif(serverUrl, item, channelId, rootId, query);
        setSending(false);
        if (result.error) {
            setError(intl.formatMessage(messages.postFailed, {error: getFullErrorMessage(result.error)}));
            return;
        }
        close();
    }, [sending, serverUrl, channelId, rootId, query, intl, close]);

    const showGifs = useCallback(() => setKind('gif'), []);
    const showStickers = useCallback(() => setKind('sticker'), []);
    const clearTerm = useCallback(() => setTerm(''), []);

    const columns = COLUMNS[kind];
    const size = Math.floor((width - (2 * PADDING) - ((columns - 1) * GAP)) / columns);

    const renderItem = useCallback(({item}: ListRenderItemInfo<GifItem>) => (
        <Tile
            item={item}
            size={size}
            onPick={onPick}
        />
    ), [size, onPick]);

    let emptyMessage;
    if (config === null || failed) {
        emptyMessage = messages.loadFailed;
    } else if (config && !config.configured) {
        emptyMessage = messages.notConfigured;
    } else if (!loading && config !== undefined) {
        emptyMessage = kind === 'sticker' ? messages.noStickers : messages.noGifs;
    }
    const empty = emptyMessage ? (
        <FormattedText
            {...emptyMessage}
            style={styles.message}
        />
    ) : (
        <Loading
            containerStyle={styles.loading}
            size='large'
            color={theme.buttonBg}
        />
    );

    return (
        <SafeAreaView
            edges={SAFE_AREA_EDGES}
            style={styles.container}
            testID='gif_picker.screen'
        >
            <View style={styles.header}>
                <Search
                    testID='gif_picker.search_bar'
                    placeholder={intl.formatMessage(kind === 'sticker' ? messages.searchStickers : messages.searchGifs)}
                    cancelButtonTitle={intl.formatMessage(messages.cancel)}
                    placeholderTextColor={changeOpacity(theme.centerChannelColor, 0.5)}
                    onChangeText={setTerm}
                    onCancel={clearTerm}
                    autoCapitalize='none'
                    keyboardAppearance={getKeyboardAppearanceFromTheme(theme)}
                    value={term}
                />
                {config?.stickers && (
                    <View style={styles.tabs}>
                        <Pressable
                            onPress={showGifs}
                            style={[styles.tab, kind === 'gif' && styles.tabSelected]}
                            testID='gif_picker.tab.gifs'
                        >
                            <FormattedText
                                {...messages.tabGifs}
                                style={[styles.tabText, kind === 'gif' && styles.tabTextSelected]}
                            />
                        </Pressable>
                        <Pressable
                            onPress={showStickers}
                            style={[styles.tab, kind === 'sticker' && styles.tabSelected]}
                            testID='gif_picker.tab.stickers'
                        >
                            <FormattedText
                                {...messages.tabStickers}
                                style={[styles.tabText, kind === 'sticker' && styles.tabTextSelected]}
                            />
                        </Pressable>
                    </View>
                )}
            </View>
            {Boolean(error) && <Text style={styles.error}>{error}</Text>}
            <FlatList
                key={kind}
                data={items}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                numColumns={columns}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps='handled'
                keyboardDismissMode='on-drag'
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={empty}
                ListFooterComponent={loading && items.length > 0 ? <Loading containerStyle={styles.loading}/> : null}
                testID='gif_picker.list'
            />
        </SafeAreaView>
    );
};

export default GifPicker;
