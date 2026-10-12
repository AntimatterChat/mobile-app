// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getThreadTitle} from './thread_title';

describe('getThreadTitle', () => {
    it('should read the name of a thread from its first message', () => {
        expect(getThreadTitle({props: {am_thread_title: ' Release 2.1 '}})).toBe('Release 2.1');
        expect(getThreadTitle({props: {am_thread_title: 3}})).toBe('');
        expect(getThreadTitle({props: null})).toBe('');
        expect(getThreadTitle(undefined)).toBe('');
    });
});
