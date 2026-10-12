// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {showPermalink} from '@actions/remote/permalink';
import {fetchMissingProfilesByIds} from '@actions/remote/user';
import {fireEvent, renderWithEverything} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import {QuotedRef} from './quoted_ref';

import type {Database} from '@nozbe/watermelondb';

jest.mock('@actions/remote/permalink', () => ({showPermalink: jest.fn()}));
jest.mock('@actions/remote/user', () => ({
    ...jest.requireActual('@actions/remote/user'),
    fetchMissingProfilesByIds: jest.fn(),
}));

describe('QuotedRef', () => {
    const serverUrl = 'https://quoted.test.com';
    let database: Database;

    const baseProps = {
        quotedId: 'quoted-id',
        quotedFiles: [],
        teammateNameDisplay: 'username',
        overrideAllowed: false,
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

    it('should quote the message from the server\'s description, and show it when tapped', () => {
        const author = TestHelper.fakeUserModel({id: 'author-id', username: 'leo'});
        const {getByText, getByTestId} = renderWithEverything(
            <QuotedRef
                {...baseProps}
                described={{post_id: 'quoted-id', user_id: 'author-id', message: 'Can you **review** this?'}}
                author={author}
            />,
            {database, serverUrl},
        );

        expect(getByText('leo')).toBeTruthy();
        expect(getByText('Can you review this?')).toBeTruthy();

        fireEvent.press(getByTestId('inline_reply.ref.quoted-id'));
        expect(showPermalink).toHaveBeenCalledWith(serverUrl, '', 'quoted-id');
    });

    it('should say when the quoted message was deleted, and not open it', () => {
        const {getByText, getByTestId} = renderWithEverything(
            <QuotedRef
                {...baseProps}
                described={{post_id: 'quoted-id', deleted: true}}
            />,
            {database, serverUrl},
        );

        expect(getByText('Original message was deleted')).toBeTruthy();
        fireEvent.press(getByTestId('inline_reply.ref.quoted-id'));
        expect(showPermalink).not.toHaveBeenCalled();
    });

    it('should not show a quoted spoiler\'s text', () => {
        const quotedPost = TestHelper.fakePostModel({id: 'quoted-id', userId: 'author-id', message: 'The ending', props: {spoiler: true}});
        const {getByText, queryByText} = renderWithEverything(
            <QuotedRef
                {...baseProps}
                quotedPost={quotedPost}
            />,
            {database, serverUrl},
        );

        expect(getByText('Spoiler')).toBeTruthy();
        expect(queryByText('The ending')).toBeNull();
    });

    it('should invite to open a message that only has images, and load its author', () => {
        const {getByText} = renderWithEverything(
            <QuotedRef
                {...baseProps}
                described={{post_id: 'quoted-id', user_id: 'unknown-id', file_count: 2, image_count: 2}}
            />,
            {database, serverUrl},
        );

        expect(getByText('Tap to see images')).toBeTruthy();
        expect(fetchMissingProfilesByIds).toHaveBeenCalledWith(serverUrl, ['unknown-id']);
    });
});
