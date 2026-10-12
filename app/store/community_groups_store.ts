// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {BehaviorSubject} from 'rxjs';

import {
    EMPTY_COMMUNITY_GROUPS,
    communitySettingsOf,
    withGroup,
    type CommunityGroup,
    type CommunityGroupsState,
} from '@utils/community_groups';

// The teams and roles of each server's communities, with their members, as the web app keeps them in memory: loaded
// on each connection and kept up to date by the group and team websocket events.
const subjects: Record<string, BehaviorSubject<CommunityGroupsState>> = {};

function getSubject(serverUrl: string) {
    if (!subjects[serverUrl]) {
        subjects[serverUrl] = new BehaviorSubject(EMPTY_COMMUNITY_GROUPS);
    }
    return subjects[serverUrl];
}

export function getCommunityGroups(serverUrl: string) {
    return getSubject(serverUrl).value;
}

export function observeCommunityGroups(serverUrl: string) {
    return getSubject(serverUrl).asObservable();
}

export function setCommunityGroups(serverUrl: string, groups: CommunityGroup[]) {
    const subject = getSubject(serverUrl);
    subject.next({...subject.value, groups: Object.fromEntries(groups.filter((g) => !g.delete_at).map((g) => [g.id, g]))});
}

export function receivedCommunityGroup(serverUrl: string, group: CommunityGroup) {
    const subject = getSubject(serverUrl);
    subject.next(withGroup(subject.value, group));
}

export function setCommunitySettings(serverUrl: string, teams: Team[]) {
    const subject = getSubject(serverUrl);
    const communities = {...subject.value.communities};
    for (const team of teams) {
        communities[team.id] = communitySettingsOf(team);
    }
    subject.next({...subject.value, communities});
}
