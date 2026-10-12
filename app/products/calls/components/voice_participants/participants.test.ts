// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {firstValueFrom} from 'rxjs';

import {setCallsState} from '@calls/state/calls_state';
import {setVoiceChannelsState} from '@calls/state/voice_channels';
import {DefaultCall, DefaultCallsState, type Call} from '@calls/types/calls';
import {DefaultVoiceChannelsState, type VoiceChannelsState} from '@calls/types/voice';

import {observeLiveVoiceChannelIds, voiceParticipants} from './participants';

const call: Call = {
    ...DefaultCall,
    channelId: 'voice1',
    screenOn: 's2',
    sessions: {
        s1: {sessionId: 's1', userId: 'u1', muted: true, raisedHand: 0},
        s2: {sessionId: 's2', userId: 'u2', muted: false, raisedHand: 12},
    },
};
const voice: VoiceChannelsState = {
    ...DefaultVoiceChannelsState,
    available: true,
    channels: {voice1: {channelId: 'voice1', teamId: 'team1', deafened: {s1: 'u1'}}},
    speaking: {voice1: {s2: true}},
};

describe('voice participants', () => {
    it('should list the people in a voice channel\'s call with what they do', () => {
        expect(voiceParticipants(call, voice, 'voice1')).toEqual([
            {sessionId: 's1', userId: 'u1', muted: true, deafened: true, speaking: false, raisedHand: false, screenSharing: false},
            {sessionId: 's2', userId: 'u2', muted: false, deafened: false, speaking: true, raisedHand: true, screenSharing: true},
        ]);
    });

    it('should list nobody for a channel that isn\'t a voice channel', () => {
        expect(voiceParticipants({...call, channelId: 'other'}, voice, 'other')).toEqual([]);
        expect(voiceParticipants(call, {...voice, available: false}, 'voice1')).toEqual([]);
    });

    it('should tell which voice channels have people in their call', async () => {
        const serverUrl = 'voice.test.com';
        setCallsState(serverUrl, {...DefaultCallsState, calls: {voice1: call, other: {...call, channelId: 'other'}}});
        setVoiceChannelsState(serverUrl, {...voice, channels: {...voice.channels, voice2: {channelId: 'voice2', teamId: 'team1', deafened: {}}}});

        expect([...await firstValueFrom(observeLiveVoiceChannelIds(serverUrl))]).toEqual(['voice1']);
    });
});
