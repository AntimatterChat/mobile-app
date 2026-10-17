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
        defaultMessage: 'Make it a topic…',
    },
    rename: {
        id: 'mobile.post_info.rename_thread',
        defaultMessage: 'Rename topic…',
    },
});

// NameThreadOption makes the thread a message starts a topic, a named conversation inside its channel, by naming it,
// or renames the topic, as Fusion's message menu does ("Make it a topic…", "Rename topic…").
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
