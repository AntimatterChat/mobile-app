// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getCallsState} from '@calls/state/calls_state';
import {
    getVoiceChannelsState,
    setSessionDeafened,
    setSessionSpeaking,
    setVoiceChannel,
    setVoiceChannelsState,
} from '@calls/state/voice_channels';
import NetworkManager from '@managers/network_manager';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import type {VoiceChannel, VoiceChannelResp} from '@calls/types/voice';

const toVoiceChannel = (resp: VoiceChannelResp): VoiceChannel => ({
    channelId: resp.channel_id,
    teamId: resp.team_id,
    deafened: resp.deafened_sessions || {},
});

// loadVoiceChannels loads the voice channels the user is a member of and the plugin's settings. Servers without the
// voice channels plugin have none.
export const loadVoiceChannels = async (serverUrl: string, groupLabel?: RequestGroupLabel) => {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const [config, channels] = await Promise.all([client.getVoiceConfig(groupLabel), client.getVoiceChannels(groupLabel)]);
        setVoiceChannelsState(serverUrl, {
            available: true,
            autoJoin: Boolean(config.auto_join),
            channels: Object.fromEntries(channels.filter((c) => c.voice).map((c) => [c.channel_id, toVoiceChannel(c)])),
            speaking: {},
        });
        return {data: true};
    } catch (error) {
        logDebug('error on loadVoiceChannels', getFullErrorMessage(error));
        setVoiceChannelsState(serverUrl, {...getVoiceChannelsState(serverUrl), available: false, channels: {}, speaking: {}});
        return {error};
    }
};

// loadVoiceChannel finds out whether a channel the user just joined is a voice channel.
export const loadVoiceChannel = async (serverUrl: string, channelId: string) => {
    if (!getVoiceChannelsState(serverUrl).available) {
        return {data: false};
    }
    try {
        const client = NetworkManager.getClient(serverUrl);
        const resp = await client.getVoiceChannel(channelId);
        setVoiceChannel(serverUrl, toVoiceChannel(resp), resp.voice);
        return {data: resp.voice};
    } catch (error) {
        logDebug('error on loadVoiceChannel', getFullErrorMessage(error));
        return {error};
    }
};

type VoiceChannelUpdatedData = {channel_id: string; team_id: string; voice: boolean};
type SessionDeafenedData = {channel_id: string; session_id: string; user_id: string; deafened: boolean};

export const handleVoiceChannelUpdated = (serverUrl: string, msg: WebSocketMessage<VoiceChannelUpdatedData>) => {
    const {channel_id: channelId, team_id: teamId, voice} = msg.data;
    const known = getVoiceChannelsState(serverUrl).channels[channelId];
    setVoiceChannel(serverUrl, known ?? {channelId, teamId, deafened: {}}, voice);
};

export const handleSessionDeafened = (serverUrl: string, msg: WebSocketMessage<SessionDeafenedData>) => {
    const {channel_id: channelId, session_id: sessionId, user_id: userId, deafened} = msg.data;
    setSessionDeafened(serverUrl, channelId, sessionId, userId, deafened);
};

// Voice channels' calls tell every member of the channel who speaks, for the people listed under them.
export const handleVoiceChannelSpeaking = (serverUrl: string, msg: WebSocketMessage<{session_id: string}>, speaking: boolean) => {
    setSessionSpeaking(serverUrl, msg.broadcast.channel_id, msg.data.session_id, speaking);
};

// A session that left its call stops being deafened or speaking.
export const handleVoiceChannelSessionLeft = (serverUrl: string, msg: WebSocketMessage<{session_id: string; user_id?: string}>) => {
    const channelId = msg.broadcast.channel_id;
    setSessionSpeaking(serverUrl, channelId, msg.data.session_id, false);
    setSessionDeafened(serverUrl, channelId, msg.data.session_id, msg.data.user_id || '', false);
};

// handleUserAddedToVoiceChannel finds out whether a channel the user was added to is a voice channel.
export const handleUserAddedToVoiceChannel = (serverUrl: string, msg: WebSocketMessage<{user_id: string}>) => {
    const channelId = msg.broadcast.channel_id;
    if (channelId && msg.data.user_id && msg.data.user_id === getCallsState(serverUrl).myUserId) {
        loadVoiceChannel(serverUrl, channelId);
    }
};
