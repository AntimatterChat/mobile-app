// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {of as of$, type Observable} from 'rxjs';
import {distinctUntilChanged, switchMap} from 'rxjs/operators';

import NetworkManager from '@managers/network_manager';
import {observeChannel} from '@queries/servers/channel';
import {observeCommunityProfilesStore} from '@store/community_profile_store';

import type {Database} from '@nozbe/watermelondb';

// observeCommunityProfileFor is a channel's own community's nickname/picture for one member, if they set one.
// It's always undefined for direct and group messages (no team), which always keep the global profile.
export const observeCommunityProfileFor = (database: Database, serverUrl: string, channelId: string, userId: string): Observable<CommunityProfile | undefined> => {
    return observeChannel(database, channelId).pipe(
        switchMap((channel) => {
            const teamId = channel?.teamId;
            if (!teamId) {
                return of$(undefined);
            }
            return observeCommunityProfilesStore(serverUrl).pipe(
                switchMap((profiles) => of$(profiles[teamId]?.[userId])),
            );
        }),
        distinctUntilChanged(),
    );
};

// observeCommunityNickname is the name someone chose to show in a channel's own community, in place of their
// global nickname.
export const observeCommunityNickname = (database: Database, serverUrl: string, channelId: string, userId: string): Observable<string | undefined> => {
    return observeCommunityProfileFor(database, serverUrl, channelId, userId).pipe(
        switchMap((profile) => of$(profile?.nickname || undefined)),
        distinctUntilChanged(),
    );
};

// observeCommunityAvatarSource is an image source ready for ProfilePicture's `source` prop, when someone set a
// picture for the channel's own community; undefined otherwise, so the caller falls back to the global picture.
export const observeCommunityAvatarSource = (database: Database, serverUrl: string, channelId: string, userId: string): Observable<{uri: string} | undefined> => {
    return observeCommunityProfileFor(database, serverUrl, channelId, userId).pipe(
        switchMap((profile) => {
            if (!profile?.avatar_update_at) {
                return of$(undefined);
            }
            try {
                const client = NetworkManager.getClient(serverUrl);
                return of$({uri: client.getCommunityAvatarUrl(profile.team_id, profile.user_id, profile.avatar_update_at)});
            } catch {
                return of$(undefined);
            }
        }),
        distinctUntilChanged((a, b) => a?.uri === b?.uri),
    );
};
