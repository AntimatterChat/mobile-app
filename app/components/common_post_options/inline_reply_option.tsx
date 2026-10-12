// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {defineMessages} from 'react-intl';

import {BaseOption} from '@components/common_post_options';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {dismissBottomSheet} from '@screens/navigation';
import {setInlineReply} from '@utils/inline_reply';

import type PostModel from '@typings/database/models/servers/post';
import type {AvailableScreens} from '@typings/screens/navigation';

type Props = {
    post: PostModel;
    sourceScreen: AvailableScreens;
}

const messages = defineMessages({
    reply: {
        id: 'mobile.post_info.reply_inline',
        defaultMessage: 'Reply',
    },
});

// InlineReplyOption makes the composer of the conversation the message is shown in quote it, as Fusion's "Reply":
// the thread's composer in a thread, else the channel's.
const InlineReplyOption = ({post, sourceScreen}: Props) => {
    const serverUrl = useServerUrl();

    const onPress = useCallback(async () => {
        const rootId = sourceScreen === Screens.THREAD ? (post.rootId || post.id) : '';
        await dismissBottomSheet();
        setInlineReply(serverUrl, post.channelId, rootId, post.id);
    }, [post, serverUrl, sourceScreen]);

    return (
        <BaseOption
            message={messages.reply}
            iconName='reply-outline'
            onPress={onPress}
            testID='post_options.reply_inline.option'
        />
    );
};

export default InlineReplyOption;
