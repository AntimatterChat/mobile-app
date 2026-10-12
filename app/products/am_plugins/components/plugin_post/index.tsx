// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {AM_PLUGIN_POST_TYPES} from '../../constants';
import {GIF_POST_PROP, parseGifItem} from '../../utils/gifs';
import DocCard from '../doc_card';
import GifPost from '../gif_post';
import PollPost from '../poll_post';
import TodoPost from '../todo_post';

import type PostModel from '@typings/database/models/servers/post';

// isAmPluginPost tells whether a post is one of the Antimatter plugins' the app shows natively,
// in place of its fallback message.
export function isAmPluginPost(post: PostModel): boolean {
    switch (post.type) {
        case AM_PLUGIN_POST_TYPES.POLL:
        case AM_PLUGIN_POST_TYPES.NOTE:
        case AM_PLUGIN_POST_TYPES.WHITEBOARD:
        case AM_PLUGIN_POST_TYPES.TODO:
            return true;
        case AM_PLUGIN_POST_TYPES.GIF:
            return Boolean(parseGifItem(post.props?.[GIF_POST_PROP]));
        default:
            return false;
    }
}

type Props = {
    isReplyPost: boolean;
    post: PostModel;
};

// AmPluginPost renders the body of an Antimatter plugin's post: polls, shared notes and
// whiteboards, todos and GIFs.
const AmPluginPost = ({isReplyPost, post}: Props) => {
    switch (post.type) {
        case AM_PLUGIN_POST_TYPES.POLL:
            return <PollPost post={post}/>;
        case AM_PLUGIN_POST_TYPES.NOTE:
            return (
                <DocCard
                    kind='note'
                    post={post}
                />
            );
        case AM_PLUGIN_POST_TYPES.WHITEBOARD:
            return (
                <DocCard
                    kind='whiteboard'
                    post={post}
                />
            );
        case AM_PLUGIN_POST_TYPES.TODO:
            return <TodoPost post={post}/>;
        case AM_PLUGIN_POST_TYPES.GIF:
            return (
                <GifPost
                    isReplyPost={isReplyPost}
                    post={post}
                />
            );
        default:
            return null;
    }
};

export default AmPluginPost;
