// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {defineMessages} from 'react-intl';

import {fetchAndSwitchToThread} from '@actions/remote/thread';
import {BaseOption} from '@components/common_post_options';
import {useServerUrl} from '@context/server';
import {dismissBottomSheet} from '@screens/navigation';

import type PostModel from '@typings/database/models/servers/post';

type Props = {
    post: PostModel;

    // Set when the message can also be replied to inline: this option then says that it replies in the thread.
    inThread?: boolean;
}

const messages = defineMessages({
    reply: {
        id: 'mobile.post_info.reply',
        defaultMessage: 'Reply',
    },
    replyInThread: {
        id: 'mobile.post_info.reply_in_thread',
        defaultMessage: 'Reply in thread',
    },
});
const ReplyOption = ({post, inThread = false}: Props) => {
    const serverUrl = useServerUrl();

    const handleReply = useCallback(async () => {
        const rootId = post.rootId || post.id;
        await dismissBottomSheet();
        fetchAndSwitchToThread(serverUrl, rootId);
    }, [post, serverUrl]);

    return (
        <BaseOption
            message={inThread ? messages.replyInThread : messages.reply}
            iconName={inThread ? 'message-text-outline' : 'reply-outline'}
            onPress={handleReply}
            testID='post_options.reply_post.option'
        />
    );
};

export default ReplyOption;
