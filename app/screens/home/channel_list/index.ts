// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {combineLatestWith, distinctUntilChanged, switchMap} from 'rxjs/operators';

import {observeIncomingCalls} from '@calls/state';
import {withServerUrl} from '@context/server';
import {queryAllMyChannelsForTeam} from '@queries/servers/channel';
import {observeCurrentTeamId, observeCurrentUserId} from '@queries/servers/system';
import {queryMyTeams} from '@queries/servers/team';
import {observeShowToS} from '@queries/servers/terms_of_service';
import {observeIsCRTEnabled} from '@queries/servers/thread';
import {observeCurrentUser} from '@queries/servers/user';
import {observeCommunityRulesStore} from '@store/community_rules_store';

import ChannelsList from './channel_list';

import type {WithDatabaseArgs} from '@typings/database/database';

type OwnProps = WithDatabaseArgs & {
    serverUrl: string;
};

const enhanced = withObservables([], ({database, serverUrl}: OwnProps) => {
    const teamsCount = queryMyTeams(database).observeCount(false);

    const showIncomingCalls = observeIncomingCalls().pipe(
        switchMap((ics) => of$(ics.incomingCalls.length > 0)),
        distinctUntilChanged(),
    );

    const currentTeamId = observeCurrentTeamId(database).pipe(distinctUntilChanged());

    return {
        currentTeamId,
        mustAcceptCommunityRules: currentTeamId.pipe(
            combineLatestWith(observeCommunityRulesStore(serverUrl)),
            switchMap(([teamId, all]) => of$(Boolean(teamId && all[teamId]?.must_accept))),
            distinctUntilChanged(),
        ),
        isCRTEnabled: observeIsCRTEnabled(database),
        hasTeams: teamsCount.pipe(
            switchMap((v) => of$(v > 0)),
            distinctUntilChanged(),
        ),
        hasMoreThanOneTeam: teamsCount.pipe(
            switchMap((v) => of$(v > 1)),
            distinctUntilChanged(),
        ),
        hasChannels: observeCurrentTeamId(database).pipe(
            switchMap((id) => (id ? queryAllMyChannelsForTeam(database, id).observeCount(false) : of$(0))),
            switchMap((v) => of$(v > 0)),
            distinctUntilChanged(),
        ),
        showToS: observeShowToS(database).pipe(distinctUntilChanged()),
        currentUserId: observeCurrentUserId(database),
        hasCurrentUser: observeCurrentUser(database).pipe(
            switchMap((u) => of$(Boolean(u))),
            distinctUntilChanged(),
        ),
        showIncomingCalls,
    };
});

export default withDatabase(withServerUrl(enhanced(ChannelsList)));
