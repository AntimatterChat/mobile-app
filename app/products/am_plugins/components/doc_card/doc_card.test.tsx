// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, fireEvent, waitFor} from '@testing-library/react-native';
import {openBrowserAsync} from 'expo-web-browser';
import React from 'react';

import NetworkManager from '@managers/network_manager';
import {renderWithEverything} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import DocCard from './index';

import type {Database} from '@nozbe/watermelondb';

jest.mock('expo-web-browser', () => ({openBrowserAsync: jest.fn()}));

const SERVER_URL = 'https://appv1.mattermost.com';

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => SERVER_URL),
}));

describe('DocCard', () => {
    let database: Database;
    const getPluginDoc = jest.fn();
    const client = {
        getPluginDoc,
        getWhiteboardThumbnailUrl: jest.fn(() => `${SERVER_URL}/plugins/com.antimatterchat.whiteboard/api/v1/docs/doc2/thumbnail?t=5`),
        getRequestHeaders: jest.fn(() => ({Authorization: 'Bearer token'})),
    };

    beforeAll(async () => {
        const server = await TestHelper.setupServerDatabase(SERVER_URL);
        database = server.database;
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(NetworkManager, 'getClient').mockReturnValue(client as any);
    });

    it('should show a shared note and open it in the web app', async () => {
        getPluginDoc.mockResolvedValue({id: 'doc1', title: 'Release checklist', update_at: Date.now() - (2 * 3600000)});
        const post = TestHelper.fakePostModel({id: 'post1', channelId: TestHelper.basicChannel!.id, type: 'custom_antimatter_note', props: {doc_id: 'doc1', title: 'Old title'}});
        const {getByText, findByText, getByTestId} = renderWithEverything(
            <DocCard
                kind='note'
                post={post}
            />,
            {database},
        );

        expect(getByText('Shared note')).toBeTruthy();
        expect(await findByText('Release checklist')).toBeTruthy();
        expect(getByText('Edited 2 hours ago')).toBeTruthy();
        expect(getPluginDoc).toHaveBeenCalledWith('com.antimatterchat.notes', 'doc1');

        await act(async () => {
            fireEvent.press(getByTestId('doc_card.note.open'));
        });
        await waitFor(() => expect(openBrowserAsync).toHaveBeenCalledWith(`${SERVER_URL}/${TestHelper.basicTeam!.name}/pl/post1`));
    });

    it('should say when the document is no longer available', async () => {
        getPluginDoc.mockRejectedValue(new Error('not found'));
        const post = TestHelper.fakePostModel({id: 'post2', type: 'custom_am_whiteboard', props: {doc_id: 'gone', title: 'Directions'}});
        const {getByText, findByText, queryByTestId} = renderWithEverything(
            <DocCard
                kind='whiteboard'
                post={post}
            />,
            {database},
        );

        expect(getByText('Directions')).toBeTruthy();
        expect(await findByText('This board was deleted, or you are not a member of its channel.')).toBeTruthy();
        expect(queryByTestId('doc_card.whiteboard.open')).toBeNull();
    });
});
