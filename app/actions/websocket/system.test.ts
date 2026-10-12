// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {updateDmGmDisplayName} from '@actions/local/channel';
import {reconcilePersistenceFlag} from '@actions/local/ephemeral_mode/wipe';
import {storeConfig} from '@actions/local/systems';
import DatabaseManager from '@database/manager';
import SessionAttributesManager from '@managers/session_attributes_manager';
import {getConfig} from '@queries/servers/system';

import {handleConfigChangedEvent} from './system';

jest.mock('@actions/local/channel');
jest.mock('@actions/local/ephemeral_mode/wipe');
jest.mock('@actions/local/systems');
jest.mock('@database/manager');
jest.mock('@managers/session_attributes_manager', () => ({
    __esModule: true,
    default: {
        refreshManifest: jest.fn().mockResolvedValue(undefined),
        removeServer: jest.fn(),
    },
}));
jest.mock('@queries/servers/system');

describe('WebSocket System Actions', () => {
    const serverUrl = 'baseHandler.test.com';

    beforeEach(async () => {
        jest.clearAllMocks();

        await DatabaseManager.init([serverUrl]);
    });

    afterEach(async () => {
        await DatabaseManager.destroyServerDatabase(serverUrl);
        jest.restoreAllMocks();
    });

    describe('handleConfigChangedEvent', () => {
        it('should handle missing operator', async () => {
            DatabaseManager.serverDatabases = {};
            const msg = {
                data: {
                    config: {
                        LockTeammateNameDisplay: true,
                    },
                },
            } as WebSocketMessage;
            await handleConfigChangedEvent(serverUrl, msg);
            expect(storeConfig).not.toHaveBeenCalled();
        });

        it('should handle config update with no display name change', async () => {
            const mockConfig = {
                LockTeammateNameDisplay: false,
            };

            jest.mocked(getConfig).mockResolvedValue({
                LockTeammateNameDisplay: 'false',
            } as ClientConfig);

            const msg = {
                data: {
                    config: mockConfig,
                },
            } as WebSocketMessage;

            await handleConfigChangedEvent(serverUrl, msg);

            expect(storeConfig).toHaveBeenCalledWith(serverUrl, mockConfig);
            expect(updateDmGmDisplayName).not.toHaveBeenCalled();
        });

        it('should handle config update with display name change', async () => {
            const mockConfig = {
                LockTeammateNameDisplay: true,
            };

            jest.mocked(getConfig).mockResolvedValue({
                LockTeammateNameDisplay: 'false',
            } as ClientConfig);

            const msg = {
                data: {
                    config: mockConfig,
                },
            } as WebSocketMessage;

            await handleConfigChangedEvent(serverUrl, msg);

            expect(storeConfig).toHaveBeenCalledWith(serverUrl, mockConfig);
            expect(updateDmGmDisplayName).toHaveBeenCalledWith(serverUrl);
        });

        it('should re-init session attributes when feature flag is enabled', async () => {
            jest.mocked(getConfig).mockResolvedValue({
                FeatureFlagSessionAttributes: 'false',
            } as ClientConfig);

            const msg = {
                data: {
                    config: {
                        FeatureFlagSessionAttributes: 'true',
                    },
                },
            } as WebSocketMessage;

            await handleConfigChangedEvent(serverUrl, msg);

            expect(SessionAttributesManager.refreshManifest).toHaveBeenCalledWith(serverUrl);
        });

        it('should stop sending session attributes when feature flag is disabled', async () => {
            jest.mocked(getConfig).mockResolvedValue({
                FeatureFlagSessionAttributes: 'true',
            } as ClientConfig);

            const msg = {
                data: {
                    config: {
                        FeatureFlagSessionAttributes: 'false',
                    },
                },
            } as WebSocketMessage;

            await handleConfigChangedEvent(serverUrl, msg);

            expect(SessionAttributesManager.removeServer).toHaveBeenCalledWith(serverUrl);
        });

        it('should reconcile the persistence flag against the new config so a live MEM-cleanup change clears zero-persistence', async () => {
            const mockConfig = {
                MobileEphemeralModeEnabled: 'true',
                MobileEphemeralModeAutoCacheCleanupDays: '5',
            };

            jest.mocked(getConfig).mockResolvedValue({
                MobileEphemeralModeEnabled: 'true',
                MobileEphemeralModeAutoCacheCleanupDays: '0',
            } as ClientConfig);

            const msg = {data: {config: mockConfig}} as WebSocketMessage;

            await handleConfigChangedEvent(serverUrl, msg);

            expect(reconcilePersistenceFlag).toHaveBeenCalledWith(serverUrl, mockConfig);
        });
    });
});
