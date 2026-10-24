// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';

import {withServerUrl} from '@context/server';
import {observeCommunityAvatarSource} from '@queries/servers/community_profile';
import {observePostAuthor} from '@queries/servers/post';
import {observeConfigBooleanValue} from '@queries/servers/system';

import Avatar from './avatar';

import type {WithDatabaseArgs} from '@typings/database/database';
import type PostModel from '@typings/database/models/servers/post';

type OwnProps = WithDatabaseArgs & {
    post: PostModel;
    serverUrl: string;
};

const withPost = withObservables(['post'], ({database, post, serverUrl}: OwnProps) => {
    const enablePostIconOverride = observeConfigBooleanValue(database, 'EnablePostIconOverride');

    return {
        author: observePostAuthor(database, post),
        enablePostIconOverride,
        communityAvatarSource: post.userId ? observeCommunityAvatarSource(database, serverUrl, post.channelId, post.userId) : of$(undefined),
    };
});

export default withDatabase(withServerUrl(withPost(Avatar)));
