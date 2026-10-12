// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Antimatter's voice channels plugin (com.antimatterchat.voice-channels): channels whose call is always open, that
// members hop in and out of.

export type VoiceConfigResp = {
    auto_join: boolean;
    allow_video: boolean;
};

export type VoiceChannelResp = {
    channel_id: string;
    team_id: string;
    voice: boolean;

    // The call sessions that stopped hearing the call, with their user.
    deafened_sessions?: Record<string, string>;
};

export type VoiceChannel = {
    channelId: string;
    teamId: string;
    deafened: Record<string, string>;
};

export type VoiceChannelsState = {

    // Whether the server has the plugin.
    available: boolean;

    // Opening a voice channel from the sidebar joins its call.
    autoJoin: boolean;
    channels: Record<string, VoiceChannel>;

    // The sessions speaking in each voice channel's call, which the server tells every member of the channel.
    speaking: Record<string, Record<string, boolean>>;
};

export const DefaultVoiceChannelsState: VoiceChannelsState = {
    available: false,
    autoJoin: false,
    channels: {},
    speaking: {},
};
