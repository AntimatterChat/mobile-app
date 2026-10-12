// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {SYSTEM_IDENTIFIERS} from '@constants/database';
import DatabaseManager from '@database/manager';
import NetworkManager from '@managers/network_manager';
import {queryMyChannelSettingsByIds} from '@queries/servers/channel';
import {queryPreferencesByCategoryAndName} from '@queries/servers/preference';

import {expireTimedMutes, muteChannelFor, unmuteChannel} from './timed_mute';

import type ServerDataOperator from '@database/operator/server_data_operator';

const serverUrl = 'timedmute.test.com';
const userId = 'user-id';
let operator: ServerDataOperator;

const mockClient = {
    updateChannelNotifyProps: jest.fn(),
    savePreferences: jest.fn(),
    deletePreferences: jest.fn(),
};

async function addChannel(channelId: string, unread: 'all' | 'mention') {
    await operator.handleMyChannelSettings({
        settings: [{id: channelId, user_id: userId, channel_id: channelId, roles: '', last_viewed_at: 1, last_update_at: 1, msg_count: 1, mention_count: 0, notify_props: {mark_unread: unread}} as ChannelMembership],
        prepareRecordsOnly: false,
    });
}

async function markUnread(channelId: string) {
    const database = DatabaseManager.serverDatabases[serverUrl]!.database;
    const [settings] = await queryMyChannelSettingsByIds(database, [channelId]).fetch();
    return settings.notifyProps.mark_unread;
}

async function muteEnds() {
    const database = DatabaseManager.serverDatabases[serverUrl]!.database;
    const prefs = await queryPreferencesByCategoryAndName(database, 'fusion_mute_until').fetch();
    return Object.fromEntries(prefs.map((p) => [p.name, Number(p.value)]));
}

describe('timed mutes', () => {
    beforeAll(() => {
        // @ts-expect-error a client with only what's needed
        NetworkManager.getClient = () => mockClient;
    });

    beforeEach(async () => {
        await DatabaseManager.init([serverUrl]);
        operator = DatabaseManager.serverDatabases[serverUrl]!.operator;
        await operator.handleSystem({systems: [{id: SYSTEM_IDENTIFIERS.CURRENT_USER_ID, value: userId}], prepareRecordsOnly: false});
    });

    afterEach(async () => {
        await DatabaseManager.destroyServerDatabase(serverUrl);
        jest.clearAllMocks();
    });

    it('should mute a channel for a while', async () => {
        await addChannel('c1', 'all');
        const before = Date.now();

        const {error} = await muteChannelFor(serverUrl, 'c1', 3600000);
        expect(error).toBeUndefined();
        expect(mockClient.updateChannelNotifyProps).toHaveBeenCalledWith(expect.objectContaining({channel_id: 'c1', mark_unread: 'mention'}));
        expect(await markUnread('c1')).toBe('mention');

        const ends = await muteEnds();
        expect(ends.c1).toBeGreaterThanOrEqual(before + 3600000);
    });

    it('should mute a channel until unmuted, forgetting an earlier end', async () => {
        await addChannel('c1', 'mention');
        await operator.handlePreferences({preferences: [{user_id: userId, category: 'fusion_mute_until', name: 'c1', value: '123'}], prepareRecordsOnly: false});

        await muteChannelFor(serverUrl, 'c1', 0);
        expect(mockClient.updateChannelNotifyProps).not.toHaveBeenCalled();
        expect(mockClient.deletePreferences).toHaveBeenCalledWith(userId, [{user_id: userId, category: 'fusion_mute_until', name: 'c1', value: '123'}]);
        expect(await muteEnds()).toEqual({});
    });

    it('should unmute a channel and forget its end', async () => {
        await addChannel('c1', 'mention');
        await operator.handlePreferences({preferences: [{user_id: userId, category: 'fusion_mute_until', name: 'c1', value: '123'}], prepareRecordsOnly: false});

        await unmuteChannel(serverUrl, 'c1');
        expect(await markUnread('c1')).toBe('all');
        expect(await muteEnds()).toEqual({});
    });

    it('should unmute only the channels whose timed mute is over', async () => {
        await addChannel('over', 'mention');
        await addChannel('later', 'mention');
        await operator.handlePreferences({
            preferences: [
                {user_id: userId, category: 'fusion_mute_until', name: 'over', value: '1000'},
                {user_id: userId, category: 'fusion_mute_until', name: 'later', value: '5000'},
            ],
            prepareRecordsOnly: false,
        });

        const {expired} = await expireTimedMutes(serverUrl, 2000);
        expect(expired).toEqual(['over']);
        expect(await markUnread('over')).toBe('all');
        expect(await markUnread('later')).toBe('mention');
        expect(await muteEnds()).toEqual({later: 5000});
    });

    it('should keep the mute and its end when the server refuses to unmute', async () => {
        await addChannel('c1', 'mention');
        await operator.handlePreferences({preferences: [{user_id: userId, category: 'fusion_mute_until', name: 'c1', value: '1000'}], prepareRecordsOnly: false});
        mockClient.updateChannelNotifyProps.mockRejectedValueOnce(new Error('offline'));

        await expireTimedMutes(serverUrl, 2000);
        expect(await markUnread('c1')).toBe('mention');
        expect(await muteEnds()).toEqual({c1: 1000});
    });
});
