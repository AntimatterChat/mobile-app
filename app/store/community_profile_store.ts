// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {BehaviorSubject} from 'rxjs';

// Everyone's own nickname and picture in each community this session knows about, kept in memory and refreshed by
// fetches and the community_profile_updated websocket event (like the web app's profiles/community_profiles.ts).
// Keyed by community (team) id, then by user id.
type CommunityProfilesState = Record<string, Record<string, CommunityProfile>>;

const subjects: Record<string, BehaviorSubject<CommunityProfilesState>> = {};

function getSubject(serverUrl: string) {
    if (!subjects[serverUrl]) {
        subjects[serverUrl] = new BehaviorSubject<CommunityProfilesState>({});
    }
    return subjects[serverUrl];
}

export function getCommunityProfile(serverUrl: string, teamId: string, userId: string): CommunityProfile | undefined {
    return getSubject(serverUrl).value[teamId]?.[userId];
}

export function observeCommunityProfilesStore(serverUrl: string) {
    return getSubject(serverUrl).asObservable();
}

export function setCommunityProfiles(serverUrl: string, teamId: string, profiles: CommunityProfile[]) {
    const subject = getSubject(serverUrl);
    subject.next({...subject.value, [teamId]: Object.fromEntries(profiles.map((p) => [p.user_id, p]))});
}

export function setCommunityProfile(serverUrl: string, profile: CommunityProfile) {
    const subject = getSubject(serverUrl);
    const forTeam = {...subject.value[profile.team_id], [profile.user_id]: profile};
    subject.next({...subject.value, [profile.team_id]: forTeam});
}
