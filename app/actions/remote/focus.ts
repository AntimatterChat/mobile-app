// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {setLocalFocusUntil} from '@actions/local/focus';
import {FOCUS_PREF_CATEGORY, FOCUS_PREF_SEEN} from '@constants/focus';
import DatabaseManager from '@database/manager';
import NetworkManager from '@managers/network_manager';
import {getCurrentUserId} from '@queries/servers/system';
import FocusStore from '@store/focus_store';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import {savePreference} from './preference';

// startFocus starts focus mode, or (while already focusing) changes its end and reason, and updates the local user
// straight away so the purple dot shows without waiting for the user_updated event.
export const startFocus = async (serverUrl: string, request: FocusRequest) => {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const userId = await getCurrentUserId(database);
        const state = await client.startFocus(userId, request);
        await setLocalFocusUntil(serverUrl, state.end_at);
        return {state};
    } catch (error) {
        logDebug('error on startFocus', getFullErrorMessage(error));
        return {error};
    }
};

// endFocus ends focus mode now, and clears the local marker straight away.
export const endFocus = async (serverUrl: string) => {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const userId = await getCurrentUserId(database);
        const state = await client.endFocus(userId);
        await setLocalFocusUntil(serverUrl, null);
        return {state};
    } catch (error) {
        logDebug('error on endFocus', getFullErrorMessage(error));
        return {error};
    }
};

// fetchFocus is the current (or last) focus, used on launch and reconnect to find a summary that ended while the
// app was away.
export const fetchFocus = async (serverUrl: string) => {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const userId = await getCurrentUserId(database);
        const state = await client.getFocus(userId);
        return {state};
    } catch (error) {
        logDebug('error on fetchFocus', getFullErrorMessage(error));
        return {error};
    }
};

// fetchFocusSummary is what the user missed in a focus's window.
export const fetchFocusSummary = async (serverUrl: string, since: number, until: number) => {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const userId = await getCurrentUserId(database);
        const summary = await client.getFocusSummary(userId, since, until);
        return {summary};
    } catch (error) {
        logDebug('error on fetchFocusSummary', getFullErrorMessage(error));
        return {error};
    }
};

// markFocusSummaryRead marks everything the summary listed read, up to the focus's end ("Mark all as read").
export const markFocusSummaryRead = async (serverUrl: string, since: number, until: number) => {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const userId = await getCurrentUserId(database);
        await client.markFocusSummaryRead(userId, since, until);
        return {};
    } catch (error) {
        logDebug('error on markFocusSummaryRead', getFullErrorMessage(error));
        return {error};
    }
};

// markFocusSummarySeen records the focus's summary as seen (a preference, shared across devices) and takes it off
// this device's pending window either way ("Mark all as read" or "Show unread badges").
export const markFocusSummarySeen = async (serverUrl: string, startAt: number) => {
    FocusStore.setFocusSummaryWindow(serverUrl, null);
    const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
    const userId = await getCurrentUserId(database);
    if (!userId) {
        return {};
    }
    return savePreference(serverUrl, [{
        user_id: userId,
        category: FOCUS_PREF_CATEGORY,
        name: FOCUS_PREF_SEEN,
        value: String(startAt),
    }]);
};
