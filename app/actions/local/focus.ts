// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {updateLocalUser} from '@actions/local/user';
import {FOCUS_UNTIL_PROP} from '@constants/focus';
import DatabaseManager from '@database/manager';
import {getCurrentUser} from '@queries/servers/user';
import {logError} from '@utils/log';

// setLocalFocusUntil updates the current user's own focus_until prop locally, straight after starting or ending
// focus mode, so the purple dot shows before the user_updated event the server sends arrives. until is milliseconds,
// or null while not focusing.
export async function setLocalFocusUntil(serverUrl: string, until: number | null) {
    try {
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const user = await getCurrentUser(database);
        if (!user) {
            return {error: 'No current user'};
        }
        const props = {...user.props};
        if (until) {
            props[FOCUS_UNTIL_PROP] = until;
        } else {
            delete props[FOCUS_UNTIL_PROP];
        }
        return await updateLocalUser(serverUrl, {props});
    } catch (error) {
        logError('Failed setLocalFocusUntil', error);
        return {error};
    }
}
