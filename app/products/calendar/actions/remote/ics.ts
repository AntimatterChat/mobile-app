// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Directory, Paths} from 'expo-file-system';
import Share from 'react-native-share';

import {DOWNLOAD_TIMEOUT} from '@constants/network';
import NetworkManager from '@managers/network_manager';
import {pathWithPrefix} from '@utils/file';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

// downloadAndShareMeetingIcs is the post's "Add to calendar": it fetches the call's current
// iTIP invitation with the user's own session (GET /meetings/{id}/ics), saves it to the
// cache directory, and hands it to the device's attachment open/share mechanism, the same
// one the file gallery uses for a document it can't preview.
export async function downloadAndShareMeetingIcs(serverUrl: string, meetingId: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const dir = new Directory(`${Paths.cache.uri}/calendar`);
        if (!dir.exists) {
            dir.create();
        }
        const destination = `${dir.uri}/${meetingId}.ics`;
        await client.apiClient.download(client.getMeetingIcsRoute(meetingId), destination.replace('file://', ''), {timeoutInterval: DOWNLOAD_TIMEOUT});
        await Share.open({
            url: pathWithPrefix('file://', destination),
            saveToFiles: true,
        });
        return {data: true};
    } catch (error) {
        logDebug('error on downloadAndShareMeetingIcs', getFullErrorMessage(error));
        return {error};
    }
}
