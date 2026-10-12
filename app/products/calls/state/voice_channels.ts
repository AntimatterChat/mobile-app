// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {BehaviorSubject, of as of$} from 'rxjs';
import {distinctUntilChanged, map, switchMap} from 'rxjs/operators';

import {DefaultVoiceChannelsState, type VoiceChannel, type VoiceChannelsState} from '@calls/types/voice';

import {observeCurrentCall} from './current_call';

const subjects: Record<string, BehaviorSubject<VoiceChannelsState>> = {};

function getSubject(serverUrl: string) {
    if (!subjects[serverUrl]) {
        subjects[serverUrl] = new BehaviorSubject(DefaultVoiceChannelsState);
    }
    return subjects[serverUrl];
}

export const getVoiceChannelsState = (serverUrl: string) => {
    return getSubject(serverUrl).value;
};

export const setVoiceChannelsState = (serverUrl: string, state: VoiceChannelsState) => {
    getSubject(serverUrl).next(state);
};

export const observeVoiceChannelsState = (serverUrl: string) => {
    return getSubject(serverUrl).asObservable();
};

export const isVoiceChannel = (serverUrl: string, channelId: string) => {
    const state = getVoiceChannelsState(serverUrl);
    return state.available && Boolean(state.channels[channelId]);
};

export const observeIsVoiceChannel = (serverUrl: string, channelId: string) => {
    return observeVoiceChannelsState(serverUrl).pipe(
        map((state) => state.available && Boolean(state.channels[channelId])),
        distinctUntilChanged(),
    );
};

export const setVoiceChannel = (serverUrl: string, channel: VoiceChannel, voice: boolean) => {
    const state = getVoiceChannelsState(serverUrl);
    const channels = {...state.channels};
    if (voice) {
        channels[channel.channelId] = channel;
    } else {
        delete channels[channel.channelId];
    }
    setVoiceChannelsState(serverUrl, {...state, channels});
};

export const setSessionDeafened = (serverUrl: string, channelId: string, sessionId: string, userId: string, deafened: boolean) => {
    const state = getVoiceChannelsState(serverUrl);
    const channel = state.channels[channelId];
    if (!channel || Boolean(channel.deafened[sessionId]) === deafened) {
        return;
    }
    const nextDeafened = {...channel.deafened};
    if (deafened) {
        nextDeafened[sessionId] = userId;
    } else {
        delete nextDeafened[sessionId];
    }
    setVoiceChannelsState(serverUrl, {...state, channels: {...state.channels, [channelId]: {...channel, deafened: nextDeafened}}});
};

export const isSessionDeafened = (serverUrl: string, channelId: string, sessionId: string) => {
    return Boolean(getVoiceChannelsState(serverUrl).channels[channelId]?.deafened[sessionId]);
};

export const setSessionSpeaking = (serverUrl: string, channelId: string, sessionId: string, speaking: boolean) => {
    const state = getVoiceChannelsState(serverUrl);
    if (!state.channels[channelId] || Boolean(state.speaking[channelId]?.[sessionId]) === speaking) {
        return;
    }
    const channelSpeaking = {...state.speaking[channelId]};
    if (speaking) {
        channelSpeaking[sessionId] = true;
    } else {
        delete channelSpeaking[sessionId];
    }
    setVoiceChannelsState(serverUrl, {...state, speaking: {...state.speaking, [channelId]: channelSpeaking}});
};

export type MyVoiceCall = {
    isVoiceChannel: boolean;
    deafened: boolean;
};

const NOT_VOICE: MyVoiceCall = {isVoiceChannel: false, deafened: false};

// observeMyVoiceCall tells whether the person's call is a voice channel's, and whether they deafened themselves in it.
export const observeMyVoiceCall = () => {
    return observeCurrentCall().pipe(
        switchMap((call) => (call ? observeVoiceChannelsState(call.serverUrl).pipe(
            map((state): MyVoiceCall => {
                const channel = state.available ? state.channels[call.channelId] : undefined;
                return channel ? {isVoiceChannel: true, deafened: Boolean(call.mySessionId && channel.deafened[call.mySessionId])} : NOT_VOICE;
            }),
        ) : of$(NOT_VOICE))),
        distinctUntilChanged((a, b) => a.isVoiceChannel === b.isVoiceChannel && a.deafened === b.deafened),
    );
};
