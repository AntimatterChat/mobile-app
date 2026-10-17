// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createIntl} from 'react-intl';

import {activeOnTop, applyOnTopChange, nextExpiry, putOnTopToast, timeLeft} from './on_top';

const intl = createIntl({locale: 'en', messages: {}});

const entry = (postId: string, createAt: number, expiresAt = 0): OnTopPost => ({
    post_id: postId,
    channel_id: 'channel1',
    created_by: 'user1',
    create_at: createAt,
    expires_at: expiresAt,
});

describe('on top utils', () => {
    it('should put the latest message put on top first, once', () => {
        const list = [entry('b', 20), entry('a', 10)];
        const again = applyOnTopChange(list, {type: 'put', entry: entry('a', 30, 99)});
        expect(again.map((o) => o.post_id)).toEqual(['a', 'b']);
        expect(again[0].expires_at).toBe(99);
        expect(again).toHaveLength(2);
    });

    it('should take a message off the top, and ignore what is not there', () => {
        const list = [entry('b', 20), entry('a', 10)];
        expect(applyOnTopChange(list, {type: 'removed', channelId: 'channel1', postId: 'a'}).map((o) => o.post_id)).toEqual(['b']);
        expect(applyOnTopChange(list, {type: 'removed', channelId: 'channel1', postId: 'c'})).toBe(list);
    });

    it('should leave out the messages whose time on top ended', () => {
        const list = [entry('a', 1, 100), entry('b', 2), entry('c', 3, 300)];
        expect(activeOnTop(list, 200).map((o) => o.post_id)).toEqual(['b', 'c']);
        expect(nextExpiry(list, 50)).toBe(100);
        expect(nextExpiry(list, 200)).toBe(300);
        expect(nextExpiry([entry('b', 2)], 200)).toBeUndefined();
    });

    it('should tell how long a message stays on top', () => {
        const now = 1_000_000_000;
        expect(timeLeft(intl, 0, now)).toBe('until removed');
        expect(timeLeft(intl, now + (5 * 60000), now)).toBe('5m left');
        expect(timeLeft(intl, now + 1000, now)).toBe('1m left');
        expect(timeLeft(intl, now + (200 * 60000), now)).toBe('3h 20m left');
        expect(timeLeft(intl, now + (51 * 3600000), now)).toBe('2d 3h left');
    });

    it('should say where and for how long a message was put on top', () => {
        expect(putOnTopToast(intl, '1h', {type: 'O', displayName: 'General'})).toBe('On top of #General for 1 hour');
        expect(putOnTopToast(intl, 'forever', {type: 'D', displayName: 'leo'})).toBe('On top of the conversation until removed');
    });
});
