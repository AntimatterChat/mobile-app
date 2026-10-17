// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// A topic is a named conversation inside its channel, as in Fusion: a thread becomes a topic once it has a name. The
// name is kept in its first message's props (the data keeps its old "thread title" name), and shows in the thread's
// header, in the threads list and under its first message.
export const THREAD_TITLE_PROP = 'am_thread_title';

// The server keeps 60 characters of a thread's name.
export const MAX_THREAD_TITLE_LENGTH = 60;

export function getThreadTitle(post?: {props?: Record<string, unknown> | null} | null): string {
    const title = post?.props?.[THREAD_TITLE_PROP];
    return typeof title === 'string' ? title.trim() : '';
}
