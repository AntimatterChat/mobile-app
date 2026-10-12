// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {useIntl, type IntlShape} from 'react-intl';
import {View} from 'react-native';

import {fetchOnTopPosts, putPostOnTop, removePostFromTop} from '@actions/remote/on_top';
import {BaseOption} from '@components/common_post_options';
import FormattedText from '@components/formatted_text';
import SlideUpPanelItem, {ITEM_HEIGHT} from '@components/slide_up_panel_item';
import {SNACK_BAR_TYPE} from '@constants/snack_bar';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import DatabaseManager from '@database/manager';
import {getChannelById} from '@queries/servers/channel';
import {bottomSheet, dismissBottomSheet} from '@screens/navigation';
import OnTopStore from '@store/on_top_store';
import {getFullErrorMessage} from '@utils/errors';
import {bottomSheetSnapPoint} from '@utils/helpers';
import {ON_TOP_DURATIONS, durationLabel, isOnTopActive, onTopMessages, putOnTopToast, type OnTopDuration} from '@utils/on_top';
import {showSnackBar} from '@utils/snack_bar';
import {makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import type PostModel from '@typings/database/models/servers/post';

const TITLE_HEIGHT = 54;

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    title: {
        color: theme.centerChannelColor,
        ...typography('Heading', 600, 'SemiBold'),
        marginBottom: 8,
    },
}));

function toast(message: string, error: boolean) {
    showSnackBar({barType: SNACK_BAR_TYPE.PLUGIN_TOAST, customMessage: message, type: error ? 'error' : 'success'});
}

async function putOnTop(serverUrl: string, intl: IntlShape, post: PostModel, duration: OnTopDuration, ms: number) {
    const result = await putPostOnTop(serverUrl, post.id, ms);
    if (result.error) {
        toast(getFullErrorMessage(result.error) || intl.formatMessage(onTopMessages.putFailed), true);
        return;
    }
    const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
    const channel = await getChannelById(database, post.channelId);
    toast(putOnTopToast(intl, duration, channel), false);
}

async function takeOffTop(serverUrl: string, intl: IntlShape, post: PostModel) {
    const result = await removePostFromTop(serverUrl, post.channelId, post.id);
    if (result.error) {
        toast(getFullErrorMessage(result.error) || intl.formatMessage(onTopMessages.removeFailed), true);
        return;
    }
    toast(intl.formatMessage(onTopMessages.removedToast), false);
}

type DurationItemProps = {
    duration: OnTopDuration;
    ms: number;
    onChoose: (duration: OnTopDuration, ms: number) => void;
};

const DurationItem = ({duration, ms, onChoose}: DurationItemProps) => {
    const intl = useIntl();
    const onPress = useCallback(() => onChoose(duration, ms), [duration, ms, onChoose]);
    return (
        <SlideUpPanelItem
            leftIcon='clock-outline'
            onPress={onPress}
            testID={`post_options.on_top.duration.${duration}`}
            text={durationLabel(intl, duration)}
        />
    );
};

type DurationsProps = {
    isOnTop: boolean;
    post: PostModel;
    serverUrl: string;
};

// OnTopDurations is the sheet choosing how long a message stays on top of its channel, or taking it
// off the top.
const OnTopDurations = ({isOnTop, post, serverUrl}: DurationsProps) => {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);

    const choose = useCallback(async (duration: OnTopDuration, ms: number) => {
        await dismissBottomSheet();
        putOnTop(serverUrl, intl, post, duration, ms);
    }, [serverUrl, intl, post]);

    const remove = async () => {
        await dismissBottomSheet();
        takeOffTop(serverUrl, intl, post);
    };

    return (
        <View testID='post_options.on_top.durations'>
            <FormattedText
                {...onTopMessages.menuLabel}
                style={styles.title}
            />
            {ON_TOP_DURATIONS.map(([duration, ms]) => (
                <DurationItem
                    key={duration}
                    duration={duration}
                    ms={ms}
                    onChoose={choose}
                />
            ))}
            {isOnTop && (
                <SlideUpPanelItem
                    leftIcon='close'
                    onPress={remove}
                    destructive={true}
                    testID='post_options.on_top.remove'
                    text={intl.formatMessage(onTopMessages.remove)}
                />
            )}
        </View>
    );
};

function isPostOnTop(list: OnTopPost[] | undefined, postId: string) {
    const now = Date.now();
    return Boolean(list?.some((o) => o.post_id === postId && isOnTopActive(o, now)));
}

// useIsOnTop tells whether a message is on top of its channel, as far as the channel's list is
// loaded (it is once the channel was opened).
function useIsOnTop(serverUrl: string, post: PostModel) {
    const [onTop, setOnTop] = useState(false);
    useEffect(() => {
        if (!OnTopStore.get(serverUrl, post.channelId)) {
            fetchOnTopPosts(serverUrl, post.channelId);
        }
        const subscription = OnTopStore.observe(serverUrl, post.channelId).subscribe((list) => {
            setOnTop(isPostOnTop(list, post.id));
        });
        return () => subscription.unsubscribe();
    }, [serverUrl, post.channelId, post.id]);
    return onTop;
}

type Props = {
    post: PostModel;
};

// OnTopOption is "Put on top" in a message's options (Antimatter): it opens the choice of how long.
const OnTopOption = ({post}: Props) => {
    const serverUrl = useServerUrl();
    const isOnTop = useIsOnTop(serverUrl, post);

    const onPress = useCallback(async () => {
        await dismissBottomSheet();
        const renderContent = () => (
            <OnTopDurations
                isOnTop={isOnTop}
                post={post}
                serverUrl={serverUrl}
            />
        );
        const items = ON_TOP_DURATIONS.length + (isOnTop ? 1 : 0);
        bottomSheet(renderContent, [1, TITLE_HEIGHT + bottomSheetSnapPoint(items, ITEM_HEIGHT)]);
    }, [isOnTop, post, serverUrl]);

    return (
        <BaseOption
            message={isOnTop ? onTopMessages.change : onTopMessages.put}
            iconName='pin-outline'
            onPress={onPress}
            testID='post_options.on_top.option'
        />
    );
};

export default OnTopOption;
