// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {Screens} from '@constants';
import {fireEvent, renderWithEverything, waitFor} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';
import {getInlineReply} from '@utils/inline_reply';

import InlineReplyOption from './inline_reply_option';

import type {Database} from '@nozbe/watermelondb';

jest.mock('@screens/navigation', () => ({dismissBottomSheet: jest.fn().mockResolvedValue(undefined)}));

describe('InlineReplyOption', () => {
    const serverUrl = 'https://inlinereply.test.com';
    let database: Database;

    beforeAll(async () => {
        database = (await TestHelper.setupServerDatabase(serverUrl)).database;
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    it('should quote a message in the channel\'s composer', async () => {
        const post = TestHelper.fakePostModel({id: 'p1', channelId: 'c1', rootId: ''});
        const {getByTestId} = renderWithEverything(
            <InlineReplyOption
                post={post}
                sourceScreen={Screens.CHANNEL}
            />,
            {database, serverUrl},
        );

        fireEvent.press(getByTestId('post_options.reply_inline.option'));
        await waitFor(() => expect(getInlineReply(serverUrl, 'c1', '')).toBe('p1'));
    });

    it('should quote a message of a thread in the thread\'s composer', async () => {
        const post = TestHelper.fakePostModel({id: 'p2', channelId: 'c1', rootId: 'root'});
        const {getByTestId} = renderWithEverything(
            <InlineReplyOption
                post={post}
                sourceScreen={Screens.THREAD}
            />,
            {database, serverUrl},
        );

        fireEvent.press(getByTestId('post_options.reply_inline.option'));
        await waitFor(() => expect(getInlineReply(serverUrl, 'c1', 'root')).toBe('p2'));
    });
});
