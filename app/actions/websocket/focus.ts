// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {FOCUS_PREF_CATEGORY, FOCUS_PREF_SEEN} from '@constants/focus';
import DatabaseManager from '@database/manager';
import {queryPreferencesByCategoryAndName} from '@queries/servers/preference';
import FocusStore from '@store/focus_store';
import {logError} from '@utils/log';

// handleFocusEndedEvent is told when a focus of the current user's ends (focus_ended), on any of their devices:
// unless they've already seen its summary elsewhere, it's queued to show here too, and their own unread badges stay
// hidden until they have.
export async function handleFocusEndedEvent(serverUrl: string, msg: WebSocketMessage) {
    try {
        const startAt: number = msg.data?.start_at;
        const endAt: number = msg.data?.end_at;
        if (!startAt || !endAt) {
            return;
        }

        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const seen = await queryPreferencesByCategoryAndName(database, FOCUS_PREF_CATEGORY, FOCUS_PREF_SEEN).fetch();
        if (seen[0]?.value === String(startAt)) {
            return;
        }

        FocusStore.setFocusSummaryWindow(serverUrl, {start_at: startAt, end_at: endAt});
    } catch (error) {
        logError('Failed handleFocusEndedEvent', error);
    }
}
