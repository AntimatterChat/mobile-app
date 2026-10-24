// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {setLocalFocusUntil} from '@actions/local/focus';
import {SYSTEM_IDENTIFIERS} from '@constants/database';
import DatabaseManager from '@database/manager';
import NetworkManager from '@managers/network_manager';
import FocusStore from '@store/focus_store';

import {endFocus, fetchFocus, fetchFocusSummary, markFocusSummaryRead, markFocusSummarySeen, startFocus} from './focus';
import {savePreference} from './preference';

import type ServerDataOperator from '@database/operator/server_data_operator';

jest.mock('@actions/local/focus');
jest.mock('./preference');
jest.mock('@store/focus_store', () => ({
    setFocusSummaryWindow: jest.fn(),
}));

const serverUrl = 'focus.actions.test.com';
const userId = 'user-1';

const focusState: FocusState = {active: true, start_at: 1000, end_at: 2000, reason: '', ended_at: 0};
const focusSummary: FocusSummary = {since: 1000, until: 2000, mention_count: 0, channels: [], threads: []};

const mockClient = {
    startFocus: jest.fn(() => focusState),
    endFocus: jest.fn(() => ({...focusState, active: false, ended_at: 2000})),
    getFocus: jest.fn(() => focusState),
    getFocusSummary: jest.fn(() => focusSummary),
    markFocusSummaryRead: jest.fn(() => ({status: 'OK'})),
};

const throwFunc = () => {
    throw new Error('error');
};

describe('focus actions', () => {
    let operator: ServerDataOperator;

    beforeAll(() => {
        // @ts-ignore
        NetworkManager.getClient = () => mockClient;
    });

    beforeEach(async () => {
        await DatabaseManager.init([serverUrl]);
        operator = DatabaseManager.serverDatabases[serverUrl]!.operator;
        await operator.handleSystem({systems: [{id: SYSTEM_IDENTIFIERS.CURRENT_USER_ID, value: userId}], prepareRecordsOnly: false});
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await DatabaseManager.destroyServerDatabase(serverUrl);
    });

    it('startFocus sends the request and updates the local marker', async () => {
        const request: FocusRequest = {duration: '1h', reason: 'Working'};
        const result = await startFocus(serverUrl, request);

        expect(mockClient.startFocus).toHaveBeenCalledWith(userId, request);
        expect(setLocalFocusUntil).toHaveBeenCalledWith(serverUrl, focusState.end_at);
        expect(result.state).toEqual(focusState);
    });

    it('startFocus returns an error when the client fails', async () => {
        jest.spyOn(NetworkManager, 'getClient').mockImplementationOnce(throwFunc);

        const result = await startFocus(serverUrl, {duration: '1h', reason: ''});
        expect(result.error).toBeDefined();
    });

    it('endFocus ends the focus and clears the local marker', async () => {
        const result = await endFocus(serverUrl);

        expect(mockClient.endFocus).toHaveBeenCalledWith(userId);
        expect(setLocalFocusUntil).toHaveBeenCalledWith(serverUrl, null);
        expect(result.state?.active).toBe(false);
    });

    it('fetchFocus returns the current focus', async () => {
        const result = await fetchFocus(serverUrl);

        expect(mockClient.getFocus).toHaveBeenCalledWith(userId);
        expect(result.state).toEqual(focusState);
    });

    it('fetchFocusSummary returns what was missed', async () => {
        const result = await fetchFocusSummary(serverUrl, 1000, 2000);

        expect(mockClient.getFocusSummary).toHaveBeenCalledWith(userId, 1000, 2000);
        expect(result.summary).toEqual(focusSummary);
    });

    it('markFocusSummaryRead marks it read up to the end', async () => {
        const result = await markFocusSummaryRead(serverUrl, 1000, 2000);

        expect(mockClient.markFocusSummaryRead).toHaveBeenCalledWith(userId, 1000, 2000);
        expect(result.error).toBeUndefined();
    });

    it('markFocusSummarySeen clears the pending window and saves the preference', async () => {
        await markFocusSummarySeen(serverUrl, 1000);

        expect(FocusStore.setFocusSummaryWindow).toHaveBeenCalledWith(serverUrl, null);
        expect(savePreference).toHaveBeenCalledWith(serverUrl, [{
            user_id: userId,
            category: 'focus',
            name: 'summary_seen',
            value: '1000',
        }]);
    });
});
