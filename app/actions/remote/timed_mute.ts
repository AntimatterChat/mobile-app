// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import DatabaseManager from '@database/manager';
import NetworkManager from '@managers/network_manager';
import {queryMyChannelSettingsByIds} from '@queries/servers/channel';
import {queryPreferencesByCategoryAndName} from '@queries/servers/preference';
import {getCurrentUserId} from '@queries/servers/system';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';
import {CATEGORY_MUTE_UNTIL, muteEnd} from '@utils/timed_mute';

import {updateChannelNotifyProps} from './channel';
import {savePreference} from './preference';
import {forceLogoutIfNecessary} from './session';

// setChannelMuted mutes or unmutes a channel for the current user (Mattermost's mark_unread notify prop).
async function setChannelMuted(serverUrl: string, channelId: string, muted: boolean) {
    const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
    const [settings] = await queryMyChannelSettingsByIds(database, [channelId]).fetch();
    if (!settings) {
        return;
    }
    const markUnread: ChannelNotifyProps['mark_unread'] = muted ? 'mention' : 'all';
    if (settings.notifyProps?.mark_unread === markUnread) {
        return;
    }

    const notifyProps: Partial<ChannelNotifyProps> = {...settings.notifyProps, mark_unread: markUnread};
    const {error} = await updateChannelNotifyProps(serverUrl, channelId, notifyProps);
    if (error) {
        throw error;
    }
    await database.write(async () => {
        await settings.update((s) => {
            s.notifyProps = notifyProps;
        });
    });
}

// forgetMuteEnd forgets when a channel's timed mute was to end, if it had one.
async function forgetMuteEnd(serverUrl: string, channelId: string) {
    const {database, operator} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
    const records = await queryPreferencesByCategoryAndName(database, CATEGORY_MUTE_UNTIL, channelId).fetch();
    if (!records.length) {
        return;
    }
    const userId = await getCurrentUserId(database);
    const client = NetworkManager.getClient(serverUrl);
    await client.deletePreferences(userId, records.map((r) => ({user_id: userId, category: CATEGORY_MUTE_UNTIL, name: channelId, value: r.value})));
    await operator.batchRecords(records.map((r) => r.prepareDestroyPermanently()), 'forgetMuteEnd');
}

// muteChannelFor mutes a channel, until a time to come when given a duration (in milliseconds), as Fusion does.
export async function muteChannelFor(serverUrl: string, channelId: string, duration: number) {
    try {
        await setChannelMuted(serverUrl, channelId, true);
        if (duration > 0) {
            const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
            const userId = await getCurrentUserId(database);
            await savePreference(serverUrl, [{user_id: userId, category: CATEGORY_MUTE_UNTIL, name: channelId, value: String(Date.now() + duration)}]);
        } else {
            await forgetMuteEnd(serverUrl, channelId);
        }
        return {};
    } catch (error) {
        logDebug('error on muteChannelFor', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}

// unmuteChannel unmutes a channel and forgets when its mute was to end.
export async function unmuteChannel(serverUrl: string, channelId: string) {
    try {
        await setChannelMuted(serverUrl, channelId, false);
        await forgetMuteEnd(serverUrl, channelId);
        return {};
    } catch (error) {
        logDebug('error on unmuteChannel', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}

// expireTimedMutes unmutes the channels whose timed mute is over, set from any client.
export async function expireTimedMutes(serverUrl: string, now = Date.now()) {
    try {
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const records = await queryPreferencesByCategoryAndName(database, CATEGORY_MUTE_UNTIL).fetch();
        const expired = records.filter((r) => muteEnd(r.value) <= now).map((r) => r.name);
        for (const channelId of expired) {
            // eslint-disable-next-line no-await-in-loop
            await unmuteChannel(serverUrl, channelId);
        }
        return {expired};
    } catch (error) {
        logDebug('error on expireTimedMutes', getFullErrorMessage(error));
        return {error};
    }
}
