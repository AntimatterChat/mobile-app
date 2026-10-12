// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import React from 'react';
import {distinctUntilChanged, map, switchMap} from 'rxjs/operators';

import {withServerUrl} from '@context/server';
import {observeTeammateNameDisplay, queryUsersById} from '@queries/servers/user';

import {observeVoiceParticipants, type VoiceParticipant} from './participants';
import VoiceParticipants from './voice_participants';

import type {WithDatabaseArgs} from '@typings/database/database';

type OwnProps = WithDatabaseArgs & {
    channelId: string;
    serverUrl?: string;
};

const userIdsKey = (participants: VoiceParticipant[]) => [...new Set(participants.map((p) => p.userId))].sort().join(',');

const enhanced = withObservables(['channelId'], ({channelId, database, serverUrl = ''}: OwnProps) => {
    const participants = observeVoiceParticipants(serverUrl, channelId);
    const userIds = participants.pipe(
        map(userIdsKey),
        distinctUntilChanged(),
    );
    return {
        participants,
        users: userIds.pipe(switchMap((ids) => queryUsersById(database, ids ? ids.split(',') : []).observe())),
        teammateNameDisplay: observeTeammateNameDisplay(database),
    };
});

const ConnectedVoiceParticipants = withDatabase(withServerUrl(enhanced(VoiceParticipants)));

type GateProps = {
    channelId: string;
    isLive: boolean;
};

const Gate = ({channelId, isLive}: GateProps) => {
    return isLive ? <ConnectedVoiceParticipants channelId={channelId}/> : null;
};

// Every channel of the list asks whether it's a voice channel with people in its call (an in-memory lookup); only
// those list them, from the database.
const gated = withObservables(['channelId'], ({channelId, serverUrl = ''}: {channelId: string; serverUrl?: string}) => ({
    isLive: observeVoiceParticipants(serverUrl, channelId).pipe(
        map((ps) => ps.length > 0),
        distinctUntilChanged(),
    ),
}));

export default React.memo(withServerUrl(gated(Gate)));
