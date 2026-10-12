// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import NetworkManager from '@managers/network_manager';
import {setCommunityGroups, setCommunitySettings} from '@store/community_groups_store';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import {forceLogoutIfNecessary} from './session';

import type {CommunityGroup} from '@utils/community_groups';

const PAGE_SIZE = 200;

// fetchCommunityGroups loads the teams and roles (custom groups) of every community and their members, page after
// page, as the web app does when it starts. teams carry each community's settings for role colours and badges.
export const fetchCommunityGroups = async (serverUrl: string, teams: Team[] | undefined, config: ClientConfig, groupLabel?: RequestGroupLabel) => {
    if (teams?.length) {
        setCommunitySettings(serverUrl, teams);
    }
    if (config.EnableCustomGroups === 'false') {
        return {groups: []};
    }

    try {
        const client = NetworkManager.getClient(serverUrl);
        const groups: CommunityGroup[] = [];
        for (let page = 0; ; page++) {
            // eslint-disable-next-line no-await-in-loop
            const batch = await client.getCommunityGroups(page, PAGE_SIZE, groupLabel);
            groups.push(...batch);
            if (batch.length < PAGE_SIZE) {
                break;
            }
        }
        setCommunityGroups(serverUrl, groups);
        return {groups};
    } catch (error) {
        logDebug('error on fetchCommunityGroups', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
};
