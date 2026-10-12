// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import DatabaseManager from '@database/manager';
import NetworkManager from '@managers/network_manager';
import {getPostById} from '@queries/servers/post';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';
import {THREAD_TITLE_PROP} from '@utils/thread_title';

import {forceLogoutIfNecessary} from './session';

// setThreadTitle names the thread of a root post, or takes its name away when title is empty, as Fusion does: by
// patching the post's props, which the server sends back to everyone as an edit.
export async function setThreadTitle(serverUrl: string, rootId: string, title: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const post = await getPostById(database, rootId);
        if (!post) {
            return {error: new Error('thread root not found')};
        }

        const props = {...post.props, [THREAD_TITLE_PROP]: title.trim()};
        const patched = await client.patchPost({id: rootId, props});
        await database.write(async () => {
            await post.update((p) => {
                p.props = patched.props ?? props;
                p.updateAt = patched.update_at;
            });
        });

        return {post};
    } catch (error) {
        logDebug('error on setThreadTitle', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}
