// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {combineLatestWith, switchMap} from 'rxjs/operators';

import {withServerUrl} from '@context/server';
import {observeChannel} from '@queries/servers/channel';
import {observeCurrentUser} from '@queries/servers/user';
import {observeCommunityGroups} from '@store/community_groups_store';
import {isCommunityWideChannel, isDefaultChannel} from '@utils/channel';
import {isAllChannelsCommunity} from '@utils/community_groups';

import LeaveChannelLabel from './leave_channel_label';

import type {WithDatabaseArgs} from '@typings/database/database';

type OwnProps = WithDatabaseArgs & {
    channelId: string;
    serverUrl: string;
}

const enhanced = withObservables(['channelId'], ({channelId, database, serverUrl}: OwnProps) => {
    const currentUser = observeCurrentUser(database);
    const channel = observeChannel(database, channelId);
    const canLeave = channel.pipe(
        combineLatestWith(currentUser, observeCommunityGroups(serverUrl)),
        switchMap(([ch, u, groups]) => {
            const isDC = isDefaultChannel(ch);

            // In a guild (all-channels-membership) community, everyone belongs to every eligible channel: leaving
            // one isn't a personal choice there, so the action is hidden (the server refuses it regardless).
            const staysForCommunity = Boolean(ch?.teamId) && isAllChannelsCommunity(groups, ch!.teamId) && isCommunityWideChannel(ch);
            return of$((!isDC || (isDC && u?.isGuest)) && !staysForCommunity);
        }),
    );

    const displayName = channel.pipe(
        switchMap((c) => of$(c?.displayName)),
    );
    const type = channel.pipe(
        switchMap((c) => of$(c?.type)),
    );

    return {
        canLeave,
        displayName,
        type,
    };
});

export default withDatabase(withServerUrl(enhanced(LeaveChannelLabel)));
