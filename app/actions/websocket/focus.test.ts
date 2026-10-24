// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import DatabaseManager from '@database/manager';
import {queryPreferencesByCategoryAndName} from '@queries/servers/preference';
import FocusStore from '@store/focus_store';

import {handleFocusEndedEvent} from './focus';

jest.mock('@queries/servers/preference');
jest.mock('@store/focus_store', () => ({
    setFocusSummaryWindow: jest.fn(),
}));

const serverUrl = 'focus.test.com';

describe('handleFocusEndedEvent', () => {
    const mockedQueryPreferences = jest.mocked(queryPreferencesByCategoryAndName);
    const mockedSetFocusSummaryWindow = jest.mocked(FocusStore.setFocusSummaryWindow);

    beforeEach(async () => {
        await DatabaseManager.init([serverUrl]);
        jest.clearAllMocks();
        mockedQueryPreferences.mockReturnValue({fetch: jest.fn().mockResolvedValue([])} as any);
    });

    afterEach(async () => {
        await DatabaseManager.deleteServerDatabase(serverUrl);
    });

    it('queues the window when nobody has seen it yet', async () => {
        const msg = {data: {start_at: 1000, end_at: 2000}} as WebSocketMessage;

        await handleFocusEndedEvent(serverUrl, msg);

        expect(mockedSetFocusSummaryWindow).toHaveBeenCalledWith(serverUrl, {start_at: 1000, end_at: 2000});
    });

    it('does nothing when the focus has already been seen', async () => {
        mockedQueryPreferences.mockReturnValue({fetch: jest.fn().mockResolvedValue([{value: '1000'}])} as any);
        const msg = {data: {start_at: 1000, end_at: 2000}} as WebSocketMessage;

        await handleFocusEndedEvent(serverUrl, msg);

        expect(mockedSetFocusSummaryWindow).not.toHaveBeenCalled();
    });

    it('does nothing when the message is missing its times', async () => {
        await handleFocusEndedEvent(serverUrl, {data: {}} as WebSocketMessage);

        expect(mockedSetFocusSummaryWindow).not.toHaveBeenCalled();
    });

    it('does nothing when the server database is missing', async () => {
        await handleFocusEndedEvent('unknown-server', {data: {start_at: 1000, end_at: 2000}} as WebSocketMessage);

        expect(mockedSetFocusSummaryWindow).not.toHaveBeenCalled();
    });
});
