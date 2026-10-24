// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {withServerUrl} from '@context/server';
import {observeCommunityNickname} from '@queries/servers/community_profile';
import {queryGroupsByName, queryGroupMembershipForMember} from '@queries/servers/group';
import {observeCurrentUserId} from '@queries/servers/system';
import {observeTeammateNameDisplay, queryUsersLike} from '@queries/servers/user';
import {getUsersByUsername} from '@utils/user';

import AtMention from './at_mention';

import type {WithDatabaseArgs} from '@typings/database/database';
import type UserModel from '@typings/database/models/servers/user';

type OwnProps = WithDatabaseArgs & {
    channelId?: string;
    mentionName: string;
    serverUrl: string;
};

// matchMentionedUser mirrors hooks/markdown.ts's useMemoMentionedUser, outside a component (this runs in the data
// layer, not render), so the community nickname lookup below can be keyed on the actual matched user's id.
function matchMentionedUser(users: UserModel[], mentionName: string): UserModel | undefined {
    const usersByUsername = getUsersByUsername(users);
    let mn = mentionName.toLowerCase();

    while (mn.length > 0) {
        if (usersByUsername[mn]) {
            return usersByUsername[mn];
        }
        if ((/[._-]$/).test(mn)) {
            mn = mn.substring(0, mn.length - 1);
        } else {
            break;
        }
    }

    return undefined;
}

const enhance = withObservables(['mentionName', 'channelId'], ({channelId, database, mentionName, serverUrl}: OwnProps) => {
    const currentUserId = observeCurrentUserId(database);
    const teammateNameDisplay = observeTeammateNameDisplay(database);

    let mn = mentionName.toLowerCase();
    if ((/[._-]$/).test(mn)) {
        mn = mn.substring(0, mn.length - 1);
    }

    const users = queryUsersLike(database, mn).observeWithColumns(['username']);

    const communityNickname = channelId ? users.pipe(
        switchMap((matchedUsers) => {
            const user = matchMentionedUser(matchedUsers, mentionName);
            return user ? observeCommunityNickname(database, serverUrl, channelId, user.id) : of$(undefined);
        }),
    ) : of$(undefined);

    return {
        currentUserId,
        teammateNameDisplay,
        users,
        groups: queryGroupsByName(database, mn).observeWithColumns(['name']),
        groupMemberships: currentUserId.pipe(switchMap((userId) => queryGroupMembershipForMember(database, userId).observe())),
        communityNickname,
    };
});

export default withDatabase(withServerUrl(enhance(AtMention)));
