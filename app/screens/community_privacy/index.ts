// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {map as map$, switchMap} from 'rxjs/operators';

import {DM_PRIVACY_CATEGORY} from '@actions/remote/community_privacy';
import {queryPreferencesByCategoryAndName} from '@queries/servers/preference';
import {observeTeam} from '@queries/servers/team';
import {observeCurrentUser} from '@queries/servers/user';

import CommunityPrivacy from './community_privacy';

import type {WithDatabaseArgs} from '@typings/database/database';

type OwnProps = WithDatabaseArgs & {
    teamId: string;
};

const enhanced = withObservables(['teamId'], ({teamId, database}: OwnProps) => ({
    currentUser: observeCurrentUser(database),
    communityName: observeTeam(database, teamId).pipe(map$((team) => team?.displayName)),
    dmPrivacy: queryPreferencesByCategoryAndName(database, DM_PRIVACY_CATEGORY, teamId).observe().pipe(
        switchMap((prefs) => of$(prefs[0]?.value)),
    ),
}));

export default withDatabase(enhanced(CommunityPrivacy));
