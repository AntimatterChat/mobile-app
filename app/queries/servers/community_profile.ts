// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {of as of$, type Observable} from 'rxjs';
import {distinctUntilChanged, switchMap} from 'rxjs/operators';

import {observeChannel} from '@queries/servers/channel';
import {observeCommunityProfilesStore} from '@store/community_profile_store';

import type {Database} from '@nozbe/watermelondb';

// observeCommunityNickname is the name someone chose to show in a channel's own community, in place of their
// global nickname. It's always empty for direct and group messages (no team), which keep the global profile.
export const observeCommunityNickname = (database: Database, serverUrl: string, channelId: string, userId: string): Observable<string | undefined> => {
    return observeChannel(database, channelId).pipe(
        switchMap((channel) => {
            const teamId = channel?.teamId;
            if (!teamId) {
                return of$(undefined);
            }
            return observeCommunityProfilesStore(serverUrl).pipe(
                switchMap((profiles) => of$(profiles[teamId]?.[userId]?.nickname || undefined)),
            );
        }),
        distinctUntilChanged(),
    );
};
