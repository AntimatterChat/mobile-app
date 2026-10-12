// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {setCallsState} from '@calls/state/calls_state';
import {getVoiceChannelsState, isVoiceChannel, setVoiceChannelsState} from '@calls/state/voice_channels';
import {DefaultCallsState} from '@calls/types/calls';
import {DefaultVoiceChannelsState} from '@calls/types/voice';
import NetworkManager from '@managers/network_manager';

import {
    handleSessionDeafened,
    handleUserAddedToVoiceChannel,
    handleVoiceChannelSessionLeft,
    handleVoiceChannelSpeaking,
    handleVoiceChannelUpdated,
    loadVoiceChannels,
} from './voice';

jest.mock('@managers/network_manager');
jest.mock('@utils/log');

const serverUrl = 'voice.test.com';

const voiceChannel = {channel_id: 'voice1', team_id: 'team1', voice: true, deafened_sessions: {s1: 'u1'}};

describe('voice channels actions', () => {
    beforeEach(() => {
        setVoiceChannelsState(serverUrl, DefaultVoiceChannelsState);
    });

    it('should load the voice channels and the auto-join setting', async () => {
        const client = {
            getVoiceConfig: jest.fn().mockResolvedValue({auto_join: true, allow_video: false}),
            getVoiceChannels: jest.fn().mockResolvedValue([voiceChannel, {channel_id: 'plain', team_id: 'team1', voice: false}]),
        };
        jest.mocked(NetworkManager.getClient).mockReturnValue(client as never);

        await loadVoiceChannels(serverUrl);

        const state = getVoiceChannelsState(serverUrl);
        expect(state.available).toBe(true);
        expect(state.autoJoin).toBe(true);
        expect(Object.keys(state.channels)).toEqual(['voice1']);
        expect(state.channels.voice1).toEqual({channelId: 'voice1', teamId: 'team1', deafened: {s1: 'u1'}});
    });

    it('should have no voice channels without the plugin', async () => {
        setVoiceChannelsState(serverUrl, {...DefaultVoiceChannelsState, available: true, channels: {voice1: {channelId: 'voice1', teamId: 'team1', deafened: {}}}});
        const client = {
            getVoiceConfig: jest.fn().mockRejectedValue(new Error('404')),
            getVoiceChannels: jest.fn().mockResolvedValue([]),
        };
        jest.mocked(NetworkManager.getClient).mockReturnValue(client as never);

        const {error} = await loadVoiceChannels(serverUrl);

        expect(error).toBeDefined();
        expect(isVoiceChannel(serverUrl, 'voice1')).toBe(false);
    });

    it('should follow the websocket events', () => {
        setVoiceChannelsState(serverUrl, {...DefaultVoiceChannelsState, available: true});

        handleVoiceChannelUpdated(serverUrl, {data: {channel_id: 'voice1', team_id: 'team1', voice: true}} as WebSocketMessage);
        expect(isVoiceChannel(serverUrl, 'voice1')).toBe(true);

        handleSessionDeafened(serverUrl, {data: {channel_id: 'voice1', session_id: 's1', user_id: 'u1', deafened: true}} as WebSocketMessage);
        handleVoiceChannelSpeaking(serverUrl, {data: {session_id: 's2'}, broadcast: {channel_id: 'voice1'}} as WebSocketMessage, true);
        expect(getVoiceChannelsState(serverUrl).channels.voice1.deafened).toEqual({s1: 'u1'});
        expect(getVoiceChannelsState(serverUrl).speaking.voice1).toEqual({s2: true});

        handleVoiceChannelSessionLeft(serverUrl, {data: {session_id: 's1', user_id: 'u1'}, broadcast: {channel_id: 'voice1'}} as WebSocketMessage);
        handleVoiceChannelSpeaking(serverUrl, {data: {session_id: 's2'}, broadcast: {channel_id: 'voice1'}} as WebSocketMessage, false);
        expect(getVoiceChannelsState(serverUrl).channels.voice1.deafened).toEqual({});
        expect(getVoiceChannelsState(serverUrl).speaking.voice1).toEqual({});

        handleVoiceChannelUpdated(serverUrl, {data: {channel_id: 'voice1', team_id: 'team1', voice: false}} as WebSocketMessage);
        expect(isVoiceChannel(serverUrl, 'voice1')).toBe(false);
    });

    it('should look up a channel the user was added to', async () => {
        setVoiceChannelsState(serverUrl, {...DefaultVoiceChannelsState, available: true});
        setCallsState(serverUrl, {...DefaultCallsState, myUserId: 'me'});
        const client = {getVoiceChannel: jest.fn().mockResolvedValue(voiceChannel)};
        jest.mocked(NetworkManager.getClient).mockReturnValue(client as never);

        handleUserAddedToVoiceChannel(serverUrl, {data: {user_id: 'someone'}, broadcast: {channel_id: 'voice1'}} as WebSocketMessage);
        expect(client.getVoiceChannel).not.toHaveBeenCalled();

        handleUserAddedToVoiceChannel(serverUrl, {data: {user_id: 'me'}, broadcast: {channel_id: 'voice1'}} as WebSocketMessage);
        await new Promise(process.nextTick);
        expect(client.getVoiceChannel).toHaveBeenCalledWith('voice1');
        expect(isVoiceChannel(serverUrl, 'voice1')).toBe(true);
    });
});
