// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {updateDmGmDisplayName} from '@actions/local/channel';
import {reconcilePersistenceFlag} from '@actions/local/ephemeral_mode/wipe';
import {storeConfig} from '@actions/local/systems';
import {fetchCategories} from '@actions/remote/category';
import {applyPersistenceModeChange} from '@actions/remote/refresh';
import DatabaseManager from '@database/manager';
import SessionAttributesManager from '@managers/session_attributes_manager';
import {getConfig, getCurrentTeamId} from '@queries/servers/system';
import EphemeralStore from '@store/ephemeral_store';
import {getFullErrorMessage} from '@utils/errors';
import {logError} from '@utils/log';

export async function handleConfigChangedEvent(serverUrl: string, msg: WebSocketMessage): Promise<void> {
    try {
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const config = msg.data.config;
        const prevConfig = await getConfig(database);
        await storeConfig(serverUrl, config);
        if (config?.LockTeammateNameDisplay && (prevConfig?.LockTeammateNameDisplay !== config.LockTeammateNameDisplay)) {
            updateDmGmDisplayName(serverUrl);
        }

        const prevManagedSetting = prevConfig?.EnableManagedChannelCategories;
        const newManagedSetting = config?.EnableManagedChannelCategories;
        if (newManagedSetting !== prevManagedSetting) {
            EphemeralStore.clearManagedCategoryPropertyIds(serverUrl);
            const currentTeamId = await getCurrentTeamId(database);
            if (currentTeamId) {
                await fetchCategories(serverUrl, currentTeamId, true);
            }
        }

        // Run last: a flag transition can wipe and recreate the server DB, invalidating
        // the `database` reference captured above.
        const needsModeChange = await reconcilePersistenceFlag(serverUrl, config);
        if (needsModeChange) {
            const {error: modeChangeError} = await applyPersistenceModeChange(serverUrl);
            if (modeChangeError) {
                logError('handleConfigChangedEvent', getFullErrorMessage(modeChangeError));
            }
        }

        const prevSessionAttributes = prevConfig?.FeatureFlagSessionAttributes === 'true';
        const newSessionAttributes = config?.FeatureFlagSessionAttributes === 'true';
        if (newSessionAttributes !== prevSessionAttributes) {
            if (newSessionAttributes) {
                await SessionAttributesManager.refreshManifest(serverUrl);
            } else {
                SessionAttributesManager.removeServer(serverUrl);
            }
        }
    } catch {
        // do nothing
    }
}

