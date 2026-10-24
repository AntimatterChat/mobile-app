// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {deletePreference, savePreference} from '@actions/remote/preference';
import DatabaseManager from '@database/manager';
import {queryPreferencesByCategoryAndName} from '@queries/servers/preference';
import {getCurrentUser} from '@queries/servers/user';
import {COMMUNITY_NOTIFY_CATEGORY, isCommunityNotifyEmpty, parseCommunityNotifyProps, withCommunityNotifyProp, type CommunityNotifyKey} from '@utils/community_notify';

// getCommunityNotifyProps reads the current user's own notification overrides for one community.
export async function getCommunityNotifyProps(serverUrl: string, teamId: string) {
    try {
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const preference = await queryPreferencesByCategoryAndName(database, COMMUNITY_NOTIFY_CATEGORY, teamId).fetch();
        return {props: parseCommunityNotifyProps(preference[0]?.value)};
    } catch (error) {
        return {error};
    }
}

// setCommunityNotifyProp merges one overridden key into the community's preference. An empty value removes that
// key (follow the person's own settings for it again); once nothing is left overridden, the whole preference is
// deleted rather than saved empty.
export async function setCommunityNotifyProp(serverUrl: string, teamId: string, key: CommunityNotifyKey, value: string) {
    const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
    const currentUser = await getCurrentUser(database);
    if (!currentUser) {
        return {error: 'no current user'};
    }

    const existing = await queryPreferencesByCategoryAndName(database, COMMUNITY_NOTIFY_CATEGORY, teamId).fetch();
    const next = withCommunityNotifyProp(parseCommunityNotifyProps(existing[0]?.value), key, value);

    const preference: PreferenceType = {category: COMMUNITY_NOTIFY_CATEGORY, name: teamId, user_id: currentUser.id, value: JSON.stringify(next)};
    if (isCommunityNotifyEmpty(next)) {
        return deletePreference(serverUrl, [preference]);
    }
    return savePreference(serverUrl, [preference]);
}

// resetCommunityNotifyProps clears every override for one community ("Use my settings everywhere").
export async function resetCommunityNotifyProps(serverUrl: string, teamId: string) {
    const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
    const currentUser = await getCurrentUser(database);
    if (!currentUser) {
        return {error: 'no current user'};
    }

    return deletePreference(serverUrl, [{category: COMMUNITY_NOTIFY_CATEGORY, name: teamId, user_id: currentUser.id, value: ''}]);
}
