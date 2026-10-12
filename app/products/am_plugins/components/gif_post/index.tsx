// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useMemo} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {Text, View} from 'react-native';
import Video from 'react-native-video';

import ExpoImage from '@components/expo_image';
import {useTheme} from '@context/theme';
import {useIsTablet} from '@hooks/device';
import {getViewPortWidth} from '@utils/images';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {useGifMediaSource} from '../../hooks/gif_media';
import {GIF_POST_PROP, STICKER_SIZE, gifDisplayMedia, gifDisplaySize, parseGifItem} from '../../utils/gifs';

import type {GifMedia} from '../../types';
import type PostModel from '@typings/database/models/servers/post';

const messages = defineMessages({
    gif: {id: 'am_plugins.gifs.gif', defaultMessage: 'GIF'},
    gifLabel: {id: 'am_plugins.gifs.gif_label', defaultMessage: 'GIF: {title}'},
    stickerLabel: {id: 'am_plugins.gifs.sticker_label', defaultMessage: 'Sticker: {title}'},
});

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    gif: {
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.04),
    },
    badge: {
        position: 'absolute',
        left: 6,
        bottom: 6,
        paddingHorizontal: 4,
        borderRadius: 3,
        backgroundColor: 'rgba(0, 0, 0, 0.56)',
        color: '#ffffff',
        ...typography('Body', 25, 'SemiBold'),
    },
    attribution: {
        marginTop: 2,
        color: changeOpacity(theme.centerChannelColor, 0.56),
        ...typography('Body', 25),
    },
}));

type MediaProps = {
    media: GifMedia;
    label: string;
    width: number;
    height: number;
    fit: 'cover' | 'contain';
};

// GifMediaView shows an animated GIF or WebP, or plays a muted, looping video.
export const GifMediaView = ({media, label, width, height, fit}: MediaProps) => {
    const source = useGifMediaSource(media.url);
    const style = useMemo(() => ({width, height}), [width, height]);

    if (!source) {
        return null;
    }
    if (media.video) {
        return (
            <Video
                source={source}
                style={style}
                repeat={true}
                muted={true}
                controls={false}
                resizeMode={fit}
                disableFocus={true}
                accessibilityLabel={label}
            />
        );
    }
    return (
        <ExpoImage
            cachePolicy='memory'
            source={source}
            style={style}
            contentFit={fit}
            autoplay={true}
            accessibilityLabel={label}
        />
    );
};

type Props = {
    isReplyPost: boolean;
    post: PostModel;
};

// GifPost shows a GIF or sticker posted with the GIFs plugin (custom_antimatter_gif posts), animated
// and at its aspect ratio, as the plugin's web component does.
const GifPost = ({isReplyPost, post}: Props) => {
    const intl = useIntl();
    const theme = useTheme();
    const isTablet = useIsTablet();
    const styles = getStyleSheet(theme);
    const item = useMemo(() => parseGifItem(post.props?.[GIF_POST_PROP]), [post.props]);

    if (!item) {
        return null;
    }

    const title = item.title || item.description || '';
    if (item.kind === 'sticker') {
        return (
            <View testID={`gif_post.sticker.${item.id}`}>
                <GifMediaView
                    media={item.post}
                    label={intl.formatMessage(messages.stickerLabel, {title})}
                    width={STICKER_SIZE}
                    height={STICKER_SIZE}
                    fit='contain'
                />
            </View>
        );
    }

    const media = gifDisplayMedia(item);
    const {width, height} = gifDisplaySize(item.post.width ? item.post : media, getViewPortWidth(isReplyPost, isTablet));
    return (
        <View testID={`gif_post.gif.${item.id}`}>
            <View style={[styles.gif, {width, height}]}>
                <GifMediaView
                    media={media}
                    label={intl.formatMessage(messages.gifLabel, {title: title || intl.formatMessage(messages.gif)})}
                    width={width}
                    height={height}
                    fit='cover'
                />
                <Text style={styles.badge}>{'GIF'}</Text>
            </View>
            {Boolean(item.attribution) && (
                <Text
                    style={[styles.attribution, {maxWidth: width}]}
                    numberOfLines={1}
                >
                    {item.attribution}
                </Text>
            )}
        </View>
    );
};

export default GifPost;
