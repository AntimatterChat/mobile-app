// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {combineLatest} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {observeChannel} from '@queries/servers/channel';
import {observeIsThreadModerator, observeMoveTargets} from '@queries/servers/move_thread';
import {observePost} from '@queries/servers/post';
import {observeCurrentUser} from '@queries/servers/user';

import MoveThread, {type Props} from './move_thread';

import type {WithDatabaseArgs} from '@typings/database/database';

const enhanced = withObservables(['rootId', 'channelId'], ({rootId, channelId, database}: Props & WithDatabaseArgs) => {
    const source = observeChannel(database, channelId);
    const currentUser = observeCurrentUser(database);
    const isModerator = combineLatest([source, currentUser]).pipe(
        switchMap(([channel, user]) => observeIsThreadModerator(database, channel, user)),
    );
    const targets = combineLatest([source, currentUser]).pipe(
        switchMap(([channel, user]) => observeMoveTargets(database, channel?.teamId || '', user)),
    );

    return {
        root: observePost(database, rootId),
        source,
        currentUser,
        isModerator,
        targets,
    };
});

export type {Props};
export default withDatabase(enhanced(MoveThread));
