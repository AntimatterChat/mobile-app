// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineLatest, type Observable} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';

import {observeCallsState} from '@calls/state/calls_state';
import {observeVoiceChannelsState} from '@calls/state/voice_channels';

import type {Call} from '@calls/types/calls';
import type {VoiceChannelsState} from '@calls/types/voice';

// A person in a voice channel's call, as listed under the channel.
export type VoiceParticipant = {
    sessionId: string;
    userId: string;
    muted: boolean;
    deafened: boolean;
    speaking: boolean;
    raisedHand: boolean;
    screenSharing: boolean;
};

const NO_PARTICIPANTS: VoiceParticipant[] = [];

export function voiceParticipants(call: Call | undefined, voice: VoiceChannelsState, channelId: string): VoiceParticipant[] {
    const channel = voice.available ? voice.channels[channelId] : undefined;
    if (!channel || !call) {
        return NO_PARTICIPANTS;
    }
    const speaking = voice.speaking[channelId] ?? {};
    return Object.values(call.sessions).map((s) => ({
        sessionId: s.sessionId,
        userId: s.userId,
        muted: s.muted,
        deafened: Boolean(channel.deafened[s.sessionId]),
        speaking: Boolean(speaking[s.sessionId]),
        raisedHand: s.raisedHand > 0,
        screenSharing: call.screenOn === s.sessionId,
    }));
}

const sameParticipants = (a: VoiceParticipant[], b: VoiceParticipant[]) => {
    return a.length === b.length && a.every((p, i) => {
        const q = b[i];
        return p.sessionId === q.sessionId && p.muted === q.muted && p.deafened === q.deafened && p.speaking === q.speaking &&
            p.raisedHand === q.raisedHand && p.screenSharing === q.screenSharing;
    });
};

// observeVoiceParticipants lists the people in a voice channel's call, live; none for other channels.
export function observeVoiceParticipants(serverUrl: string, channelId: string): Observable<VoiceParticipant[]> {
    return combineLatest([observeCallsState(serverUrl), observeVoiceChannelsState(serverUrl)]).pipe(
        map(([calls, voice]) => voiceParticipants(calls.calls[channelId], voice, channelId)),
        distinctUntilChanged(sameParticipants),
    );
}

// observeLiveVoiceChannelIds gives the voice channels with people in their call: they stay listed in folded categories.
export function observeLiveVoiceChannelIds(serverUrl: string): Observable<Set<string>> {
    return combineLatest([observeCallsState(serverUrl), observeVoiceChannelsState(serverUrl)]).pipe(
        map(([calls, voice]) => new Set(Object.keys(voice.available ? voice.channels : {}).filter((id) => Object.keys(calls.calls[id]?.sessions ?? {}).length > 0))),
        distinctUntilChanged((a, b) => a.size === b.size && [...a].every((id) => b.has(id))),
    );
}
