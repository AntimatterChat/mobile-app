// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {distinctUntilChanged, switchMap} from 'rxjs/operators';

import {observeUser} from '@queries/servers/user';
import {getUserTimezone} from '@utils/user';

import Message from './message';

import type {WithDatabaseArgs} from '@typings/database/database';
import type PostModel from '@typings/database/models/servers/post';

// The author's time zone, which the times written in the message without one are in.
const enhanced = withObservables(['post'], ({database, post}: WithDatabaseArgs & {post: PostModel}) => ({
    authorZone: observeUser(database, post.userId).pipe(
        switchMap((user) => of$(user ? getUserTimezone(user) || undefined : undefined)),
        distinctUntilChanged(),
    ),
}));

export default withDatabase(enhanced(Message));
