// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {AM_PLUGIN_POST_TYPES} from '../../constants';
import PollPost from '../poll_post';

import type PostModel from '@typings/database/models/servers/post';

// isAmPluginPost tells whether a post is one of the Antimatter plugins' the app shows natively,
// in place of its fallback message.
export function isAmPluginPost(post: PostModel): boolean {
    switch (post.type) {
        case AM_PLUGIN_POST_TYPES.POLL:
            return true;
        default:
            return false;
    }
}

type Props = {
    isReplyPost: boolean;
    post: PostModel;
};

// AmPluginPost renders the body of an Antimatter plugin's post: polls.
const AmPluginPost = ({post}: Props) => {
    switch (post.type) {
        case AM_PLUGIN_POST_TYPES.POLL:
            return <PollPost post={post}/>;
        default:
            return null;
    }
};

export default AmPluginPost;
