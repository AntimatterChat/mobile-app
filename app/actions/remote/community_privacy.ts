// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {deletePreference, savePreference} from '@actions/remote/preference';
import {updateMe} from '@actions/remote/user';
import DatabaseManager from '@database/manager';
import {getCurrentUser} from '@queries/servers/user';
import {PROFILE_PRIVACY_PROP, parseProfilePrivacy, withHiddenFields, type ProfileField, type ProfilePrivacy} from '@utils/community_privacy';

// DM_PRIVACY_CATEGORY and DM_PRIVACY_DEFAULT_NAME: a preference per community (name = its team id), or
// DM_PRIVACY_DEFAULT_NAME for the person's own default, read across every community they share with someone to
// work out that person's own direct-message privacy towards them (server-side only: see user_block.go).
export const DM_PRIVACY_CATEGORY = 'dm_privacy';
export const DM_PRIVACY_DEFAULT_NAME = 'default';
export const DMPrivacy = {
    EVERYONE: 'everyone',
    ASK: 'ask',
    REFUSE: 'refuse',
} as const;
export type DMPrivacyValue = typeof DMPrivacy[keyof typeof DMPrivacy];

// getProfilePrivacy reads the current user's own profile_privacy choices.
export async function getProfilePrivacy(serverUrl: string): Promise<{privacy?: ProfilePrivacy; error?: unknown}> {
    try {
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const currentUser = await getCurrentUser(database);
        if (!currentUser) {
            return {error: 'no current user'};
        }
        return {privacy: parseProfilePrivacy(currentUser.props)};
    } catch (error) {
        return {error};
    }
}

// setCommunityHiddenFields sets (or, with null, clears) which profile details one community (or
// PROFILE_DEFAULT) sees. It's a user prop, so it goes through the generic patch-me endpoint, like the web app's
// setHiddenFields.
export async function setCommunityHiddenFields(serverUrl: string, scope: string, fields: ProfileField[] | null) {
    const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
    const currentUser = await getCurrentUser(database);
    if (!currentUser) {
        return {error: 'no current user'};
    }

    const privacy = parseProfilePrivacy(currentUser.props);
    const next = withHiddenFields(privacy, scope, fields);

    return updateMe(serverUrl, {props: {...currentUser.props, [PROFILE_PRIVACY_PROP]: JSON.stringify(next)}});
}

// setCommunityDMPrivacy sets, or (with null) clears, one community's own direct-message privacy choice.
export async function setCommunityDMPrivacy(serverUrl: string, scope: string, value: DMPrivacyValue | null) {
    const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
    const currentUser = await getCurrentUser(database);
    if (!currentUser) {
        return {error: 'no current user'};
    }

    const preference: PreferenceType = {category: DM_PRIVACY_CATEGORY, name: scope, user_id: currentUser.id, value: value || ''};
    if (value === null) {
        return deletePreference(serverUrl, [preference]);
    }
    return savePreference(serverUrl, [preference]);
}
