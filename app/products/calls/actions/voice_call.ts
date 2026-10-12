// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {muteMyself, setMyselfDeafened, unmuteMyself} from '@calls/actions/calls';
import {joinCallWithoutAlert} from '@calls/alerts';
import {setJoiningChannelId} from '@calls/state/actions';
import {getCurrentCall, observeCurrentCall} from '@calls/state/current_call';
import {getGlobalCallsState} from '@calls/state/global_calls_state';
import {getVoiceChannelsState, isSessionDeafened, isVoiceChannel, setSessionDeafened} from '@calls/state/voice_channels';
import NetworkManager from '@managers/network_manager';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import type {CurrentCall} from '@calls/types/calls';
import type {IntlShape} from 'react-intl';
import type {Subscription} from 'rxjs';

// autoJoinVoiceChannel joins the call of a voice channel opened from the channel list, when the voice channels plugin
// is set to. A person is in one call at most: the call of another voice channel is left on the way, but not another
// kind of call (a direct message's, say), which only the channel's Join button leaves.
export const autoJoinVoiceChannel = async (serverUrl: string, channelId: string, intl: IntlShape) => {
    const voice = getVoiceChannelsState(serverUrl);
    if (!voice.autoJoin || !isVoiceChannel(serverUrl, channelId)) {
        return false;
    }

    const current = getCurrentCall();
    if (current && ((current.serverUrl === serverUrl && current.channelId === channelId) || !isVoiceChannel(current.serverUrl, current.channelId))) {
        return false;
    }
    if (getGlobalCallsState().joiningChannelId) {
        return false;
    }

    setJoiningChannelId(channelId);
    try {
        return await joinCallWithoutAlert(intl, serverUrl, channelId);
    } finally {
        setJoiningChannelId(null);
    }
};

type Deafened = {
    serverUrl: string;
    channelId: string;
    sessionId: string;
    userId: string;

    // Deafening muted the person: undeafening unmutes them.
    mutedByDeafen: boolean;
    lastMuted: boolean;
    subscription?: Subscription;
};

let deafened: Deafened | null = null;

const shareDeafened = async (serverUrl: string, channelId: string, sessionId: string, on: boolean) => {
    try {
        const client = NetworkManager.getClient(serverUrl);
        await client.setVoiceSessionDeafened(channelId, sessionId, on);
    } catch (error) {
        logDebug('error on shareDeafened', getFullErrorMessage(error));
    }
};

const stopWatching = () => {
    const was = deafened;
    deafened = null;
    was?.subscription?.unsubscribe();
    return was;
};

const undeafen = (was: Deafened) => {
    setSessionDeafened(was.serverUrl, was.channelId, was.sessionId, was.userId, false);
    shareDeafened(was.serverUrl, was.channelId, was.sessionId, false);
};

// watchCall follows the call while the person is deafened: leaving it undeafens their past session for everyone, and
// unmuting undeafens them.
const watchCall = (call: CurrentCall | null) => {
    if (!deafened) {
        return;
    }
    if (!call || call.serverUrl !== deafened.serverUrl || call.channelId !== deafened.channelId || call.mySessionId !== deafened.sessionId) {
        undeafen(stopWatching()!);
        return;
    }

    const muted = call.sessions[deafened.sessionId]?.muted ?? true;
    if (deafened.lastMuted && !muted) {
        setMyselfDeafened(false);
        undeafen(stopWatching()!);
        return;
    }
    deafened.lastMuted = muted;
};

// setDeafened stops or resumes hearing the call of the voice channel the person is in, and tells everyone. Deafening
// also mutes them.
export const setDeafened = (on: boolean) => {
    const call = getCurrentCall();
    if (!call?.connected || !call.mySessionId || !isVoiceChannel(call.serverUrl, call.channelId)) {
        return;
    }
    const {serverUrl, channelId, mySessionId: sessionId, myUserId: userId} = call;
    if (isSessionDeafened(serverUrl, channelId, sessionId) === on) {
        return;
    }

    setSessionDeafened(serverUrl, channelId, sessionId, userId, on);
    setMyselfDeafened(on);
    if (on) {
        const muted = call.sessions[sessionId]?.muted ?? true;
        if (!muted) {
            muteMyself();
        }
        stopWatching();
        deafened = {serverUrl, channelId, sessionId, userId, mutedByDeafen: !muted, lastMuted: muted};
        deafened.subscription = observeCurrentCall().subscribe(watchCall);
    } else {
        const was = stopWatching();
        if (was?.mutedByDeafen) {
            unmuteMyself();
        }
    }
    shareDeafened(serverUrl, channelId, sessionId, on);
};

export const toggleDeafened = () => {
    const call = getCurrentCall();
    if (call) {
        setDeafened(!isSessionDeafened(call.serverUrl, call.channelId, call.mySessionId));
    }
};
