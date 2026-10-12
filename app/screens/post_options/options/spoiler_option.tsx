// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {defineMessages} from 'react-intl';

import {BaseOption} from '@components/common_post_options';
import {useSpoilerShown} from '@hooks/spoiler';
import {dismissBottomSheet} from '@screens/navigation';

type Props = {
    postId: string;
}

const messages = defineMessages({
    show: {
        id: 'mobile.post_info.spoiler.show',
        defaultMessage: 'Show spoiler',
    },
    hide: {
        id: 'mobile.post_info.spoiler.hide',
        defaultMessage: 'Hide spoiler',
    },
});

// SpoilerOption shows a spoiler, or hides it again once shown, as the spoiler tool of Fusion's messages does.
const SpoilerOption = ({postId}: Props) => {
    const [shown, setShown] = useSpoilerShown(postId);

    const onPress = useCallback(async () => {
        await dismissBottomSheet();
        setShown(!shown);
    }, [shown, setShown]);

    return (
        <BaseOption
            message={shown ? messages.hide : messages.show}
            iconName={shown ? 'eye-off-outline' : 'eye-outline'}
            onPress={onPress}
            testID={shown ? 'post_options.hide_spoiler.option' : 'post_options.show_spoiler.option'}
        />
    );
};

export default SpoilerOption;
