// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useDatabase} from '@nozbe/watermelondb/react';
import {renderHook, waitFor} from '@testing-library/react-native';

import {fetchFocus, fetchFocusSummary, markFocusSummarySeen} from '@actions/remote/focus';
import {Screens} from '@constants';
import {queryPreferencesByCategoryAndName} from '@queries/servers/preference';
import {navigateToScreen} from '@screens/navigation';
import FocusStore from '@store/focus_store';
import {showSnackBar} from '@utils/snack_bar';

import {useFocusSummaryEffect} from './focus';

jest.mock('@nozbe/watermelondb/react', () => ({
    useDatabase: jest.fn(),
}));

jest.mock('@actions/remote/focus', () => ({
    fetchFocus: jest.fn(() => Promise.resolve({state: {active: false, start_at: 0, end_at: 0, reason: '', ended_at: 0}})),
    fetchFocusSummary: jest.fn(() => Promise.resolve({summary: undefined})),
    markFocusSummarySeen: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@queries/servers/preference', () => ({
    queryPreferencesByCategoryAndName: jest.fn(() => ({fetch: jest.fn().mockResolvedValue([])})),
}));

jest.mock('@screens/navigation', () => ({
    navigateToScreen: jest.fn(),
}));

jest.mock('@utils/snack_bar', () => ({
    showSnackBar: jest.fn(),
}));

const SERVER_URL = 'focus_hook.test.com';

describe('useFocusSummaryEffect', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useDatabase).mockReturnValue({} as any);
        FocusStore.setFocusSummaryWindow(SERVER_URL, null);
    });

    it('does nothing while the app is not active', async () => {
        renderHook(() => useFocusSummaryEffect(SERVER_URL, 'background'));

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(fetchFocus).not.toHaveBeenCalled();
    });

    it('looks for a focus that ended while away, and queues its summary', async () => {
        jest.mocked(fetchFocus).mockResolvedValue({state: {active: false, start_at: 1000, end_at: 2000, reason: '', ended_at: 2000}});
        jest.mocked(fetchFocusSummary).mockResolvedValue({summary: {since: 1000, until: 2000, mention_count: 0, channels: [{channel_id: 'c1', team_id: 't1', type: 'O', name: 'c', display_name: 'C', count: 1, mention_count: 0, last_post_at: 1500, last_sender_id: 'u1'}], threads: []}});

        renderHook(() => useFocusSummaryEffect(SERVER_URL, 'active'));

        await waitFor(() => {
            expect(navigateToScreen).toHaveBeenCalledWith(Screens.FOCUS_SUMMARY, {startAt: 1000, endAt: 2000});
        });
    });

    it('marks it seen with a toast when nothing came in', async () => {
        jest.mocked(fetchFocus).mockResolvedValue({state: {active: false, start_at: 1000, end_at: 2000, reason: '', ended_at: 2000}});
        jest.mocked(fetchFocusSummary).mockResolvedValue({summary: {since: 1000, until: 2000, mention_count: 0, channels: [], threads: []}});

        renderHook(() => useFocusSummaryEffect(SERVER_URL, 'active'));

        await waitFor(() => {
            expect(markFocusSummarySeen).toHaveBeenCalledWith(SERVER_URL, 1000);
        });
        expect(showSnackBar).toHaveBeenCalled();
        expect(navigateToScreen).not.toHaveBeenCalled();
    });

    it('does not queue a focus already seen', async () => {
        jest.mocked(queryPreferencesByCategoryAndName).mockReturnValue({fetch: jest.fn().mockResolvedValue([{value: '1000'}])} as any);
        jest.mocked(fetchFocus).mockResolvedValue({state: {active: false, start_at: 1000, end_at: 2000, reason: '', ended_at: 2000}});

        renderHook(() => useFocusSummaryEffect(SERVER_URL, 'active'));

        await waitFor(() => {
            expect(fetchFocus).toHaveBeenCalled();
        });
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(navigateToScreen).not.toHaveBeenCalled();
        expect(fetchFocusSummary).not.toHaveBeenCalled();
    });
});
