// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {combineLatest} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {Permissions} from '@constants';
import {withServerUrl} from '@context/server';
import {observeChannel} from '@queries/servers/channel';
import {observePermissionForChannel} from '@queries/servers/role';
import {observeCurrentUserId} from '@queries/servers/system';
import {observeCurrentUser} from '@queries/servers/user';

import {amPluginsStore} from '../../store';

import PollPost from './poll_post';

import type {WithDatabaseArgs} from '@typings/database/database';
import type PostModel from '@typings/database/models/servers/post';

type OwnProps = WithDatabaseArgs & {
    serverUrl: string;
    post: PostModel;
};

const enhanced = withObservables(['post', 'serverUrl'], ({database, serverUrl, post}: OwnProps) => {
    const pollId = typeof post.props?.poll_id === 'string' ? post.props.poll_id : '';
    const channel = observeChannel(database, post.channelId);
    const currentUser = observeCurrentUser(database);

    // Besides its creator, who may delete others' messages in the channel may close a poll, as the
    // plugin's server decides.
    const canModerate = combineLatest([channel, currentUser]).pipe(
        switchMap(([c, u]) => observePermissionForChannel(database, c, u, Permissions.DELETE_OTHERS_POSTS, false)),
    );

    return {
        poll: amPluginsStore.observePoll(serverUrl, pollId),
        currentUserId: observeCurrentUserId(database),
        canModerate,
    };
});

export default withDatabase(withServerUrl(enhanced(PollPost)));
