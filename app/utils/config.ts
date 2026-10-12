// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {isMinimumServerVersion} from './helpers';

export function hasReliableWebsocket(version?: string, reliableWebsocketsConfig?: string) {
    if (version && isMinimumServerVersion(version, 6, 5)) {
        return true;
    }

    return reliableWebsocketsConfig === 'true';
}

export function isZeroPersistenceConfig(config: ClientConfig | undefined) {
    return config?.MobileEphemeralModeEnabled === 'true' && config.MobileEphemeralModeAutoCacheCleanupDays === '0';
}

/**
 * Whether the server manages sidebar categories. Mattermost 11.7 had an EnableManagedChannelCategories setting;
 * later servers (Mattermost 11.8+ and Antimatter) replaced it with the ManagedChannelCategories feature flag.
 */
export function isManagedChannelCategoriesConfig(config: Partial<ClientConfig> | undefined) {
    return config?.FeatureFlagManagedChannelCategories === 'true' || config?.EnableManagedChannelCategories === 'true';
}

export function parseNonNegativeConfigNumber(value: string | undefined): number {
    const parsed = Number(value ?? '0');
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}
