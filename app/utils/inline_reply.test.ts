// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PostTypes} from '@constants/post';
import TestHelper from '@test/test_helper';

import {
    canReplyInline,
    getInlineReply,
    getQuoted,
    inlineReplyProps,
    plainText,
    quotedIcon,
    replyToId,
    setInlineReply,
    subscribeToInlineReplies,
} from './inline_reply';

describe('inline replies', () => {
    it('should read the id of the message a post replies to', () => {
        expect(replyToId({props: {reply_to: 'abc'}})).toBe('abc');
        expect(replyToId({props: {}})).toBe('');
        expect(replyToId(null)).toBe('');
    });

    it('should leave the quoted author un-notified only when asked', () => {
        expect(inlineReplyProps('abc', true)).toEqual({reply_to: 'abc'});
        expect(inlineReplyProps('abc', false)).toEqual({reply_to: 'abc', reply_to_mention: false});
    });

    it('should not quote system, burn-on-read, deleted or pending messages', () => {
        expect(canReplyInline(TestHelper.fakePostModel({type: ''}))).toBe(true);
        expect(canReplyInline(TestHelper.fakePostModel({type: PostTypes.JOIN_CHANNEL}))).toBe(false);
        expect(canReplyInline(TestHelper.fakePostModel({type: PostTypes.BURN_ON_READ}))).toBe(false);
        expect(canReplyInline(TestHelper.fakePostModel({type: '', deleteAt: 1}))).toBe(false);
        expect(canReplyInline(TestHelper.fakePostModel({type: '', id: 'pending', pendingPostId: 'pending'}))).toBe(false);
    });

    describe('getQuoted', () => {
        const described: PostReplyTo = {post_id: 'q1', user_id: 'u1', message: 'Described text', file_count: 2, image_count: 1};

        it('should prefer the loaded message, which follows edits', () => {
            const post = TestHelper.fakePostModel({id: 'q1', userId: 'u2', message: 'Edited text'});
            const quoted = getQuoted('q1', post, [{mime_type: 'image/png'}, {mime_type: 'application/pdf'}], described);
            expect(quoted).toMatchObject({deleted: false, userId: 'u2', message: 'Edited text', fileCount: 2, imageCount: 1, spoiler: false});
        });

        it('should leave a loaded spoiler\'s text out', () => {
            const post = TestHelper.fakePostModel({id: 'q1', message: 'Secret', props: {spoiler: true}});
            expect(getQuoted('q1', post, [], described)).toMatchObject({message: '', spoiler: true});
        });

        it('should say a loaded message was deleted', () => {
            const post = TestHelper.fakePostModel({id: 'q1', deleteAt: 5});
            expect(getQuoted('q1', post, [], described).deleted).toBe(true);
        });

        it('should fall back to the server\'s description', () => {
            expect(getQuoted('q1', undefined, [], described)).toMatchObject({deleted: false, userId: 'u1', message: 'Described text', fileCount: 2, imageCount: 1});
        });

        it('should take a message neither loaded nor described as deleted', () => {
            expect(getQuoted('q1', undefined, [], undefined).deleted).toBe(true);
            expect(getQuoted('q1', undefined, [], {post_id: 'q1', deleted: true}).deleted).toBe(true);
        });
    });

    it('should tell what a quoted message holds besides text', () => {
        const base = {deleted: false, message: '', fileCount: 0, imageCount: 0};
        expect(quotedIcon({...base, spoiler: true, imageCount: 1, fileCount: 1})).toBe('eye-off-outline');
        expect(quotedIcon({...base, type: 'custom_poll'})).toBe('chart-bar');
        expect(quotedIcon({...base, imageCount: 1, fileCount: 2})).toBe('image-outline');
        expect(quotedIcon({...base, fileCount: 1})).toBe('paperclip');
        expect(quotedIcon(base)).toBeUndefined();
        expect(quotedIcon({...base, deleted: true, fileCount: 1})).toBeUndefined();
    });

    it('should give a one-line plain version of markdown', () => {
        expect(plainText('## Title\n- **bold** and _it_ [link](http://x)\n```\ncode\n```\n-# small')).toBe('Title bold and it link [code] small');
        expect(plainText('a'.repeat(10), 4)).toBe('aaaa');
    });

    it('should remember the message each composer replies to', () => {
        const listener = jest.fn();
        const unsubscribe = subscribeToInlineReplies(listener);

        setInlineReply('server', 'channel', '', 'post1');
        expect(getInlineReply('server', 'channel', '')).toBe('post1');
        expect(getInlineReply('server', 'channel', 'root')).toBe('');
        expect(listener).toHaveBeenCalledTimes(1);

        setInlineReply('server', 'channel', '', '');
        expect(getInlineReply('server', 'channel', '')).toBe('');
        expect(listener).toHaveBeenCalledTimes(2);
        unsubscribe();
    });
});
