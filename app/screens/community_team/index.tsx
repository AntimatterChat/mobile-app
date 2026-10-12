// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import React from 'react';
import {of as of$} from 'rxjs';
import {map} from 'rxjs/operators';

import {observeChannel, observeMyChannel} from '@queries/servers/channel';
import {observeTeammateNameDisplay, observeUser, queryUsersById} from '@queries/servers/user';
import {bottomSheet, dismissBottomSheet} from '@screens/navigation';

import CommunityTeam, {FACES} from './community_team';

import type {WithDatabaseArgs} from '@typings/database/database';
import type {CommunityGroup} from '@utils/community_groups';

type OwnProps = WithDatabaseArgs & {team: CommunityGroup};

const enhanced = withObservables(['team'], ({database, team}: OwnProps) => {
    const memberIds = (team.member_ids ?? []).slice(0, FACES);
    return {
        lead: team.lead_id ? observeUser(database, team.lead_id) : of$(undefined),
        members: queryUsersById(database, memberIds).observe(),
        channel: team.channel_id ? observeChannel(database, team.channel_id) : of$(undefined),
        isChannelMember: team.channel_id ? observeMyChannel(database, team.channel_id).pipe(map(Boolean)) : of$(false),
        teammateNameDisplay: observeTeammateNameDisplay(database),
    };
});

const ConnectedCommunityTeam = withDatabase(enhanced(CommunityTeam));

const HEAD_HEIGHT = 64;
const DESCRIPTION_HEIGHT = 48;
const FACT_HEIGHT = 26;
const FACES_HEIGHT = 44;
const REACH_HEIGHT = 72;

// openCommunityTeam shows a team's card in a bottom sheet, in place of the sheet it was opened from (one card at a
// time, as on the web).
export async function openCommunityTeam(team: CommunityGroup) {
    await dismissBottomSheet();
    const height = HEAD_HEIGHT +
        (team.description ? DESCRIPTION_HEIGHT : 0) +
        (FACT_HEIGHT * (team.lead_id ? 3 : 2)) +
        (team.member_ids?.length ? FACES_HEIGHT : 0) +
        ((team.channel_id || team.lead_id) ? REACH_HEIGHT : 0);
    bottomSheet(() => <ConnectedCommunityTeam team={team}/>, [1, height]);
}
