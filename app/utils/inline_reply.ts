// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PostTypes} from '@constants/post';
import {isBoRPost} from '@utils/bor';
import {isPostPendingOrFailed, isSystemMessage} from '@utils/post';
import {isSpoilerPost} from '@utils/spoiler';

import type {CompassIconName} from '@components/compass_icon';
import type PostModel from '@typings/database/models/servers/post';

// Inline replies answer one message of a conversation, quoting it above the reply, without opening a thread, as in
// Fusion and Discord. The reply's reply_to prop holds the quoted message's id; the server describes that message in
// the reply's metadata.reply_to, so that it can be quoted without being loaded.

// A reply notifies the quoted message's author unless its reply_to_mention prop is false. Fusion's reply bar has an
// "@" switch for it, and remembers the choice in this preference as the default of the next replies.
export const MENTION_PREFERENCE_CATEGORY = 'inline_replies';
export const MENTION_PREFERENCE_NAME = 'mention_quoted_author';

type WithProps = {props?: Record<string, unknown> | null};

// replyToId is the id of the message a post replies to inline, or ''.
export function replyToId(post?: WithProps | null): string {
    const id = post?.props?.reply_to;
    return typeof id === 'string' ? id : '';
}

// inlineReplyProps are the props of a post replying to postId, notifying its author or not.
export function inlineReplyProps(postId: string, mention: boolean): Record<string, unknown> {
    return mention ? {reply_to: postId} : {reply_to: postId, reply_to_mention: false};
}

// canReplyInline tells whether a message can be quoted: the server refuses system messages, burn-on-read messages and
// messages it doesn't have yet.
export function canReplyInline(post: PostModel): boolean {
    return !isSystemMessage(post) &&
        !isBoRPost(post) &&
        !post.deleteAt &&
        !isPostPendingOrFailed(post);
}

export type Quoted = {
    deleted: boolean;
    userId?: string;
    message: string;
    type?: string;
    fileCount: number;
    imageCount: number;
    overrideUsername?: string;

    // Set when the quoted message is a spoiler: its text is left out then.
    spoiler?: boolean;

    // Set when the quoted message is loaded and was posted by an incoming webhook: replies don't notify anyone then.
    fromWebhook?: boolean;
};

const DELETED: Quoted = {deleted: true, message: '', fileCount: 0, imageCount: 0};

export type QuotedFile = {mime_type?: string};

// getQuoted is what to show of a quoted message: the message itself when it's loaded, as it follows edits and
// deletions as they happen, else the server's description of it.
export function getQuoted(id: string, post: PostModel | undefined, files: QuotedFile[], described?: PostReplyTo): Quoted {
    if (post) {
        if (post.deleteAt || isBoRPost(post)) {
            return DELETED;
        }
        const fromWebhook = post.props?.from_webhook === 'true';
        const spoiler = isSpoilerPost(post);
        const override = post.props?.override_username;
        return {
            deleted: false,
            userId: post.userId,
            message: spoiler ? '' : post.message,
            spoiler,
            type: post.type,
            fileCount: files.length,
            imageCount: files.filter((file) => file.mime_type?.startsWith('image')).length,
            overrideUsername: fromWebhook && typeof override === 'string' ? override : undefined,
            fromWebhook,
        };
    }
    if (described && described.post_id === id && !described.deleted) {
        return {
            deleted: false,
            userId: described.user_id,
            message: described.spoiler ? '' : described.message || '',
            type: described.type,
            fileCount: described.file_count || 0,
            imageCount: described.image_count || 0,
            overrideUsername: described.override_username,
            spoiler: described.spoiler,
        };
    }

    // Not loaded and not described: the server dropped it as deleted, or can't show it to this reader.
    return DELETED;
}

// The icons of the messages plugins post, by post type.
const TYPE_ICONS: Record<string, CompassIconName> = {
    custom_poll: 'chart-bar',
    custom_antimatter_gif: 'file-gif',
    [PostTypes.CUSTOM_CALLS]: 'phone-outline',
    custom_am_whiteboard: 'draw',
    custom_antimatter_note: 'file-text-outline',
};

// quotedIcon is the icon that tells what a quoted message holds besides text, as in Discord and Fusion: a poll, a GIF,
// a call, images or other files.
export function quotedIcon(quoted: Quoted): CompassIconName | undefined {
    if (quoted.deleted) {
        return undefined;
    }
    if (quoted.spoiler) {
        return 'eye-off-outline';
    }
    if (quoted.type && TYPE_ICONS[quoted.type]) {
        return TYPE_ICONS[quoted.type];
    }
    if (quoted.imageCount) {
        return 'image-outline';
    }
    return quoted.fileCount ? 'paperclip' : undefined;
}

// plainText gives a one-line plain version of a message's markdown, as Fusion's: for quotes that show a message
// without rendering it.
export function plainText(message: string, max = 300): string {
    return message.
        replace(/```[\s\S]*?```/g, ' [code] ').
        replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').
        replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').
        replace(/^\s{0,3}(?:#{1,6}|>|[-*+]|\d+\.|-#)\s+/gm, '').
        replace(/(\*\*|__|~~|`)/g, '').
        replace(/(^|\W)[*_]([^*_\n]+)[*_](?=\W|$)/g, '$1$2').
        replace(/\s+/g, ' ').
        trim().
        slice(0, max);
}

// The message each composer replies to, by server, channel and thread, for the session: the reply bar shows it until
// the reply is sent or the reply cancelled.
const replies = new Map<string, string>();
const listeners = new Set<() => void>();

function replyKey(serverUrl: string, channelId: string, rootId: string) {
    return `${serverUrl}|${channelId}|${rootId}`;
}

export function subscribeToInlineReplies(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getInlineReply(serverUrl: string, channelId: string, rootId: string): string {
    return replies.get(replyKey(serverUrl, channelId, rootId)) ?? '';
}

// setInlineReply makes the composer of a channel (rootId '') or thread reply to postId, or to nothing when ''.
export function setInlineReply(serverUrl: string, channelId: string, rootId: string, postId: string) {
    const key = replyKey(serverUrl, channelId, rootId);
    if ((replies.get(key) ?? '') === postId) {
        return;
    }
    if (postId) {
        replies.set(key, postId);
    } else {
        replies.delete(key);
    }
    listeners.forEach((listener) => listener());
}
