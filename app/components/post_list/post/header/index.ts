// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';

import {withServerUrl} from '@context/server';
import {observeCommunityLook, observeCommunityOfChannel} from '@queries/servers/community_groups';

import Header from './header';

import type {WithDatabaseArgs} from '@typings/database/database';
import type PostModel from '@typings/database/models/servers/post';
import type UserModel from '@typings/database/models/servers/user';

type OwnProps = WithDatabaseArgs & {
    author?: UserModel;
    post: PostModel;
    serverUrl: string;
};

// The author's name shows in their role's colour and with their team's tag, of the conversation's community.
const enhanced = withObservables(['author', 'post'], ({author, database, post, serverUrl}: OwnProps) => ({
    communityLook: post.userId ? observeCommunityLook(serverUrl, observeCommunityOfChannel(database, post.channelId), post.userId, author ? author.observe() : of$(undefined)) : of$({}),
}));

export default withDatabase(withServerUrl(enhanced(Header)));
