// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import NetworkManager from '@managers/network_manager';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import {amPluginsStore} from '../../store';

// refreshEnabledPlugins notes which plugins the server runs, from their webapp manifests, to offer
// the plugins' actions (e.g. creating a poll) only where they work.
export async function refreshEnabledPlugins(serverUrl: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const manifests = await client.getPluginsManifests();
        amPluginsStore.setEnabledPlugins(serverUrl, manifests.map((m) => m.id));
        return {data: true};
    } catch (error) {
        logDebug('error on refreshEnabledPlugins', getFullErrorMessage(error));
        return {error};
    }
}
