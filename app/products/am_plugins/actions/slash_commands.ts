// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {POLLS_PLUGIN_ID} from '../constants';
import {openCreatePoll} from '../hooks/composer_actions';
import {amPluginsStore} from '../store';

// handleAmPluginsSlashCommand runs the plugins' commands the app handles itself, as the Fusion web
// UI does: /poll alone opens the poll creation form rather than the server's dialog. It tells
// whether it handled the command.
export function handleAmPluginsSlashCommand(serverUrl: string, value: string, channelId: string, rootId?: string) {
    if (value.trim() === '/poll' && amPluginsStore.isPluginEnabled(serverUrl, POLLS_PLUGIN_ID)) {
        openCreatePoll(channelId, rootId);
        return true;
    }
    return false;
}
