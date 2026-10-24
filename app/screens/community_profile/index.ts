// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {combineLatest, of as of$} from 'rxjs';
import {map as map$, switchMap} from 'rxjs/operators';

import {withServerUrl} from '@context/server';
import {observeTeam} from '@queries/servers/team';
import {observeCurrentUser} from '@queries/servers/user';
import {observeCommunityProfilesStore} from '@store/community_profile_store';

import CommunityProfile from './community_profile';

import type {WithDatabaseArgs} from '@typings/database/database';

type OwnProps = WithDatabaseArgs & {
    teamId: string;
    serverUrl: string;
};

const enhanced = withObservables(['teamId'], ({teamId, database, serverUrl}: OwnProps) => {
    const currentUser = observeCurrentUser(database);

    return {
        currentUser,
        communityName: observeTeam(database, teamId).pipe(map$((team) => team?.displayName)),
        profile: combineLatest([currentUser, observeCommunityProfilesStore(serverUrl)]).pipe(
            switchMap(([user, all]) => of$(user ? all[teamId]?.[user.id] : undefined)),
        ),
    };
});

export default withDatabase(withServerUrl(enhanced(CommunityProfile)));
