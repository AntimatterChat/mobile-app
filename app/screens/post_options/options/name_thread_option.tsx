// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {defineMessages} from 'react-intl';

import {BaseOption} from '@components/common_post_options';
import {Screens} from '@constants';
import {dismissBottomSheet, navigateToScreen} from '@screens/navigation';
import {getThreadTitle} from '@utils/thread_title';

import type PostModel from '@typings/database/models/servers/post';

type Props = {
    post: PostModel;
}

const messages = defineMessages({
    name: {
        id: 'mobile.post_info.name_thread',
        defaultMessage: 'Name thread…',
    },
    rename: {
        id: 'mobile.post_info.rename_thread',
        defaultMessage: 'Rename thread…',
    },
});

// NameThreadOption names the thread a message starts, making it a sub-chat of its channel, as Fusion's menu does.
const NameThreadOption = ({post}: Props) => {
    const currentTitle = getThreadTitle(post);

    const onPress = useCallback(async () => {
        await dismissBottomSheet();
        navigateToScreen(Screens.NAME_THREAD, {rootId: post.id, currentTitle});
    }, [post.id, currentTitle]);

    return (
        <BaseOption
            message={currentTitle ? messages.rename : messages.name}
            iconName='message-text-outline'
            onPress={onPress}
            testID='post_options.name_thread.option'
        />
    );
};

export default NameThreadOption;
