// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import FocusStore from './focus_store';

const SERVER_URL = 'https://appv1.mattermost.com';
const OTHER_SERVER_URL = 'https://other.mattermost.com';

describe('FocusStore', () => {
    afterEach(() => {
        FocusStore.setFocusSummaryWindow(SERVER_URL, null);
        FocusStore.setFocusSummaryWindow(OTHER_SERVER_URL, null);
    });

    it('starts with nothing pending', () => {
        expect(FocusStore.getState(SERVER_URL)).toBeNull();
    });

    it('sets and clears the pending window', () => {
        const window = {start_at: 1000, end_at: 2000};
        FocusStore.setFocusSummaryWindow(SERVER_URL, window);
        expect(FocusStore.getState(SERVER_URL)).toEqual(window);

        FocusStore.setFocusSummaryWindow(SERVER_URL, null);
        expect(FocusStore.getState(SERVER_URL)).toBeNull();
    });

    it('keeps a separate window per server', () => {
        FocusStore.setFocusSummaryWindow(SERVER_URL, {start_at: 1, end_at: 2});
        expect(FocusStore.getState(OTHER_SERVER_URL)).toBeNull();
    });

    it('notifies observers of the server given', () => {
        const listener = jest.fn();
        const subscription = FocusStore.observe(SERVER_URL).subscribe(listener);
        listener.mockClear();

        FocusStore.setFocusSummaryWindow(SERVER_URL, {start_at: 1, end_at: 2});
        expect(listener).toHaveBeenCalledWith({start_at: 1, end_at: 2});

        subscription.unsubscribe();
    });

    it('does not notify again for the same window', () => {
        const window = {start_at: 1, end_at: 2};
        FocusStore.setFocusSummaryWindow(SERVER_URL, window);

        const listener = jest.fn();
        const subscription = FocusStore.observe(SERVER_URL).subscribe(listener);
        listener.mockClear();

        FocusStore.setFocusSummaryWindow(SERVER_URL, {start_at: 1, end_at: 2});
        expect(listener).not.toHaveBeenCalled();

        subscription.unsubscribe();
    });
});
