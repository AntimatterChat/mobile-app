// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {BehaviorSubject} from 'rxjs';

// The rules of each community the server has told this session about, kept in memory and refreshed by the
// community_rules_updated and community_rules_accepted websocket events (like the web app's teams/community_rules.ts).
const subjects: Record<string, BehaviorSubject<Record<string, CommunityRules>>> = {};

function getSubject(serverUrl: string) {
    if (!subjects[serverUrl]) {
        subjects[serverUrl] = new BehaviorSubject<Record<string, CommunityRules>>({});
    }
    return subjects[serverUrl];
}

export function getCommunityRules(serverUrl: string, teamId: string): CommunityRules | undefined {
    return getSubject(serverUrl).value[teamId];
}

export function observeCommunityRulesStore(serverUrl: string) {
    return getSubject(serverUrl).asObservable();
}

export function setCommunityRules(serverUrl: string, rules: CommunityRules) {
    const subject = getSubject(serverUrl);
    subject.next({...subject.value, [rules.team_id]: rules});
}
