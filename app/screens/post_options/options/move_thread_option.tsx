// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {defineMessages} from 'react-intl';

import {BaseOption} from '@components/common_post_options';
import {Screens} from '@constants';
import {dismissBottomSheet, navigateToScreen} from '@screens/navigation';

import type PostModel from '@typings/database/models/servers/post';

type Props = {
    post: PostModel;
}

const messages = defineMessages({
    move: {
        id: 'mobile.post_info.move_thread',
        defaultMessage: 'Move thread…',
    },
});

// MoveThreadOption moves the thread of a message (its first message or a reply) to another channel of the community,
// as Fusion's message menu does. The post options show it to the thread's author and the channel's moderators.
const MoveThreadOption = ({post}: Props) => {
    const onPress = useCallback(async () => {
        await dismissBottomSheet();
        navigateToScreen(Screens.MOVE_THREAD, {rootId: post.rootId || post.id, channelId: post.channelId});
    }, [post.rootId, post.id, post.channelId]);

    return (
        <BaseOption
            message={messages.move}
            iconName='message-arrow-right-outline'
            onPress={onPress}
            testID='post_options.move_thread.option'
        />
    );
};

export default MoveThreadOption;
