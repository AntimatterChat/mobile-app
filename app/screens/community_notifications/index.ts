// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {map as map$, switchMap} from 'rxjs/operators';

import {queryPreferencesByCategoryAndName} from '@queries/servers/preference';
import {observeTeam} from '@queries/servers/team';
import {COMMUNITY_NOTIFY_CATEGORY, parseCommunityNotifyProps} from '@utils/community_notify';

import CommunityNotifications from './community_notifications';

import type {WithDatabaseArgs} from '@typings/database/database';

type OwnProps = WithDatabaseArgs & {
    teamId: string;
};

const enhanced = withObservables(['teamId'], ({teamId, database}: OwnProps) => ({
    communityName: observeTeam(database, teamId).pipe(map$((team) => team?.displayName)),
    notifyProps: queryPreferencesByCategoryAndName(database, COMMUNITY_NOTIFY_CATEGORY, teamId).observe().pipe(
        switchMap((prefs) => of$(parseCommunityNotifyProps(prefs[0]?.value))),
    ),
}));

export default withDatabase(enhanced(CommunityNotifications));
