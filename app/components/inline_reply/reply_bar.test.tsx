// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {savePreference} from '@actions/remote/preference';
import {fireEvent, renderWithEverything} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import {Bar} from './reply_bar';

import type {Database} from '@nozbe/watermelondb';

jest.mock('@actions/remote/preference', () => ({savePreference: jest.fn()}));
jest.mock('@actions/remote/user', () => ({
    ...jest.requireActual('@actions/remote/user'),
    fetchMissingProfilesByIds: jest.fn(),
}));

describe('inline reply Bar', () => {
    const serverUrl = 'https://replybar.test.com';
    let database: Database;

    const quotedPost = TestHelper.fakePostModel({id: 'quoted-id', userId: 'author-id', message: 'Lunch at noon?'});
    const author = TestHelper.fakeUserModel({id: 'author-id', username: 'leo'});
    const baseProps = {
        quotedId: 'quoted-id',
        quotedPost,
        quotedFiles: [],
        author,
        teammateNameDisplay: 'username',
        overrideAllowed: false,
        mention: true,
        currentUserId: 'me',
        onCancel: jest.fn(),
    };

    beforeAll(async () => {
        database = (await TestHelper.setupServerDatabase(serverUrl)).database;
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should show what the draft replies to, and cancel the reply', () => {
        const {getByText, getByTestId} = renderWithEverything(<Bar {...baseProps}/>, {database, serverUrl});

        expect(getByText('Replying to')).toBeTruthy();
        expect(getByText('leo')).toBeTruthy();
        expect(getByText('Lunch at noon?')).toBeTruthy();

        fireEvent.press(getByTestId('inline_reply.bar.cancel'));
        expect(baseProps.onCancel).toHaveBeenCalled();
    });

    it('should remember whether replies notify the quoted author', () => {
        const {getByText, getByTestId} = renderWithEverything(<Bar {...baseProps}/>, {database, serverUrl});

        expect(getByText('@ On')).toBeTruthy();
        fireEvent.press(getByTestId('inline_reply.bar.mention'));
        expect(savePreference).toHaveBeenCalledWith(serverUrl, [{user_id: 'me', category: 'inline_replies', name: 'mention_quoted_author', value: 'false'}]);
    });

    it('should not offer to notify yourself', () => {
        const {queryByTestId} = renderWithEverything(
            <Bar
                {...baseProps}
                currentUserId='author-id'
            />,
            {database, serverUrl},
        );

        expect(queryByTestId('inline_reply.bar.mention')).toBeNull();
    });
});
