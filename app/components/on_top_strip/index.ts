// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {combineLatest, of as of$} from 'rxjs';
import {distinctUntilChanged, switchMap} from 'rxjs/operators';

import {Permissions} from '@constants';
import {withServerUrl} from '@context/server';
import {observeChannel, observeIsReadOnlyChannel} from '@queries/servers/channel';
import {observePermissionForChannel} from '@queries/servers/role';
import {observeCurrentUserId} from '@queries/servers/system';
import {observeCurrentUser} from '@queries/servers/user';
import OnTopStore from '@store/on_top_store';

import OnTopStrip from './on_top_strip';

import type {Database} from '@nozbe/watermelondb';
import type {WithDatabaseArgs} from '@typings/database/database';
import type ChannelModel from '@typings/database/models/servers/channel';

// observeCanChangeOnTop tells whether the user may put messages on top of a channel and take them
// off, as the server decides: not in an archived channel, and where they may post (read-only
// channels and the channel's moderation apply).
export const observeCanChangeOnTop = (database: Database, channelId: string) => {
    const channel = observeChannel(database, channelId);
    const currentUser = observeCurrentUser(database);
    const canPost = combineLatest([channel, currentUser]).pipe(
        switchMap(([c, u]) => observePermissionForChannel(database, c, u, Permissions.CREATE_POST, false)),
    );
    return combineLatest([channel, observeIsReadOnlyChannel(database, channelId), canPost]).pipe(
        switchMap(([c, readOnly, can]: [ChannelModel | undefined, boolean, boolean]) => of$(Boolean(c && c.deleteAt === 0 && !readOnly && can))),
        distinctUntilChanged(),
    );
};

type OwnProps = WithDatabaseArgs & {
    channelId: string;
    serverUrl: string;
};

const enhanced = withObservables(['channelId', 'serverUrl'], ({database, channelId, serverUrl}: OwnProps) => ({
    list: OnTopStore.observe(serverUrl, channelId),
    canRemove: observeCanChangeOnTop(database, channelId),
    currentUserId: observeCurrentUserId(database),
}));

export default withDatabase(withServerUrl(enhanced(OnTopStrip)));
