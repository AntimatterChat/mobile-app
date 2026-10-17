// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createIntl} from 'react-intl';

import {muteMyself, setMyselfDeafened, unmuteMyself} from '@calls/actions/calls';
import {joinCallWithoutAlert} from '@calls/alerts';
import {setCurrentCall} from '@calls/state/current_call';
import {isSessionDeafened, setVoiceChannelsState} from '@calls/state/voice_channels';
import {type CurrentCall, DefaultCurrentCall} from '@calls/types/calls';
import {DefaultVoiceChannelsState} from '@calls/types/voice';
import NetworkManager from '@managers/network_manager';

import {autoJoinVoiceChannel, setDeafened, toggleDeafened} from './voice_call';

jest.mock('@calls/actions/calls', () => ({
    muteMyself: jest.fn(),
    unmuteMyself: jest.fn(),
    setMyselfDeafened: jest.fn(),
}));
jest.mock('@calls/alerts', () => ({joinCallWithoutAlert: jest.fn().mockResolvedValue(true)}));
jest.mock('@managers/network_manager');
jest.mock('@utils/log');

const serverUrl = 'voice.test.com';
const intl = createIntl({locale: 'en', messages: {}});
const voice = (channelId: string) => ({channelId, teamId: 'team1', deafened: {}});

function inCall(channelId: string, muted: boolean): CurrentCall {
    return {
        ...DefaultCurrentCall,
        serverUrl,
        channelId,
        connected: true,
        myUserId: 'me',
        mySessionId: 'mine',
        sessions: {mine: {sessionId: 'mine', userId: 'me', muted, raisedHand: 0}},
    };
}

describe('voice channel calls', () => {
    const client = {setVoiceSessionDeafened: jest.fn().mockResolvedValue({})};

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(NetworkManager.getClient).mockReturnValue(client as never);
        setVoiceChannelsState(serverUrl, {...DefaultVoiceChannelsState, available: true, autoJoin: true, channels: {voice1: voice('voice1'), voice2: voice('voice2')}});
        setCurrentCall(null);
    });

    describe('autoJoinVoiceChannel', () => {
        it('should join a voice channel opened from the list, moving from another voice channel', async () => {
            expect(await autoJoinVoiceChannel(serverUrl, 'voice1', intl)).toBe(true);
            expect(joinCallWithoutAlert).toHaveBeenCalledWith(intl, serverUrl, 'voice1');

            setCurrentCall(inCall('voice1', true));
            expect(await autoJoinVoiceChannel(serverUrl, 'voice2', intl)).toBe(true);
            expect(joinCallWithoutAlert).toHaveBeenLastCalledWith(intl, serverUrl, 'voice2');
        });

        it('should not join other channels, the same call, another kind of call, or without auto-join', async () => {
            expect(await autoJoinVoiceChannel(serverUrl, 'general', intl)).toBe(false);

            setCurrentCall(inCall('voice1', true));
            expect(await autoJoinVoiceChannel(serverUrl, 'voice1', intl)).toBe(false);

            setCurrentCall(inCall('dm', true));
            expect(await autoJoinVoiceChannel(serverUrl, 'voice1', intl)).toBe(false);

            setCurrentCall(null);
            setVoiceChannelsState(serverUrl, {...DefaultVoiceChannelsState, available: true, autoJoin: false, channels: {voice1: voice('voice1')}});
            expect(await autoJoinVoiceChannel(serverUrl, 'voice1', intl)).toBe(false);
            expect(joinCallWithoutAlert).not.toHaveBeenCalled();
        });
    });

    describe('setDeafened', () => {
        it('should mute when deafening and unmute when undeafening, and tell everyone', () => {
            setCurrentCall(inCall('voice1', false));

            toggleDeafened();
            expect(isSessionDeafened(serverUrl, 'voice1', 'mine')).toBe(true);
            expect(setMyselfDeafened).toHaveBeenLastCalledWith(true);
            expect(muteMyself).toHaveBeenCalled();
            expect(client.setVoiceSessionDeafened).toHaveBeenLastCalledWith('voice1', 'mine', true);

            toggleDeafened();
            expect(isSessionDeafened(serverUrl, 'voice1', 'mine')).toBe(false);
            expect(setMyselfDeafened).toHaveBeenLastCalledWith(false);
            expect(unmuteMyself).toHaveBeenCalled();
            expect(client.setVoiceSessionDeafened).toHaveBeenLastCalledWith('voice1', 'mine', false);
        });

        it('should undeafen when the person unmutes', () => {
            setCurrentCall(inCall('voice1', true));
            setDeafened(true);
            expect(muteMyself).not.toHaveBeenCalled();

            setCurrentCall(inCall('voice1', false));
            expect(isSessionDeafened(serverUrl, 'voice1', 'mine')).toBe(false);
            expect(setMyselfDeafened).toHaveBeenLastCalledWith(false);
            expect(unmuteMyself).not.toHaveBeenCalled();
        });

        it('should undeafen the past session when the call ends', () => {
            setCurrentCall(inCall('voice1', true));
            setDeafened(true);

            setCurrentCall(null);
            expect(isSessionDeafened(serverUrl, 'voice1', 'mine')).toBe(false);
            expect(client.setVoiceSessionDeafened).toHaveBeenLastCalledWith('voice1', 'mine', false);
        });

        it('should not deafen outside a voice channel\'s call', () => {
            setCurrentCall(inCall('dm', false));
            setDeafened(true);
            expect(setMyselfDeafened).not.toHaveBeenCalled();
            expect(client.setVoiceSessionDeafened).not.toHaveBeenCalled();
        });
    });
});
