// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {distinctUntilChanged, switchMap} from 'rxjs/operators';

import {withServerUrl} from '@context/server';
import {observeCommunityAvatarSource, observeCommunityNickname} from '@queries/servers/community_profile';
import {observeConfigBooleanValue, observeCurrentUserId} from '@queries/servers/system';
import {observeCurrentUser, observeTeammateNameDisplay} from '@queries/servers/user';

import UserItem from './user_item';

import type {WithDatabaseArgs} from '@typings/database/database';
import type UserModel from '@typings/database/models/servers/user';

type OwnProps = WithDatabaseArgs & {
    channelId?: string;
    serverUrl: string;
    user?: UserProfile | UserModel;
};

// channelId (optional) is which community's own nickname/picture to show instead of the global profile; callers
// without one (or for a direct/group message) get the global profile, unchanged.
const enhanced = withObservables(['channelId', 'user'], ({channelId, database, serverUrl, user}: OwnProps) => {
    const isCustomStatusEnabled = observeConfigBooleanValue(database, 'EnableCustomUserStatuses');
    const currentUserId = observeCurrentUserId(database);
    const locale = observeCurrentUser(database).pipe(
        switchMap((u) => of$(u?.locale)),
        distinctUntilChanged(),
    );
    const teammateNameDisplay = observeTeammateNameDisplay(database);

    return {
        isCustomStatusEnabled,
        currentUserId,
        locale,
        teammateNameDisplay,
        hideGuestTags: observeConfigBooleanValue(database, 'HideGuestTags'),
        communityNickname: (channelId && user?.id) ? observeCommunityNickname(database, serverUrl, channelId, user.id) : of$(undefined),
        communityAvatarSource: (channelId && user?.id) ? observeCommunityAvatarSource(database, serverUrl, channelId, user.id) : of$(undefined),
    };
});

export default withDatabase(withServerUrl(enhanced(UserItem)));
