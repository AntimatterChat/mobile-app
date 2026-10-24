// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {map as map$} from 'rxjs/operators';

import {withServerUrl} from '@context/server';
import {observeTeam} from '@queries/servers/team';
import {observeCommunityRulesStore} from '@store/community_rules_store';

import CommunityRules from './community_rules';

import type {WithDatabaseArgs} from '@typings/database/database';

type OwnProps = WithDatabaseArgs & {
    teamId: string;
    serverUrl: string;
};

const enhanced = withObservables(['teamId'], ({teamId, database, serverUrl}: OwnProps) => ({
    communityName: observeTeam(database, teamId).pipe(map$((team) => team?.displayName)),
    rules: observeCommunityRulesStore(serverUrl).pipe(map$((all) => all[teamId])),
}));

export default withDatabase(withServerUrl(enhanced(CommunityRules)));
