// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import NetworkManager from '@managers/network_manager';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import {forceLogoutIfNecessary} from './session';

// moveThread moves the thread of postId (its first message, or a reply) to channelId, another channel of the same
// community, through Antimatter's move_to_channel. With flatten, the replies become messages of the channel. The
// server deletes the originals and posts the copies (which notify nobody), a pointer in the old place and a note in
// the new one: the websocket brings them all. It returns the moved first message, or the server's error.
export async function moveThread(serverUrl: string, postId: string, channelId: string, flatten = false) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const post = await client.moveThreadToChannel(postId, channelId, flatten);
        return {post};
    } catch (error) {
        logDebug('error on moveThread', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}
