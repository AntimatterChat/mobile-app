// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {queryFilesForPost} from '@queries/servers/file';
import {observePost} from '@queries/servers/post';
import {observeConfigBooleanValue} from '@queries/servers/system';
import {observeTeammateNameDisplay, observeUser} from '@queries/servers/user';

import type {WithDatabaseArgs} from '@typings/database/database';
import type FileModel from '@typings/database/models/servers/file';

type QuotedArgs = WithDatabaseArgs & {

    // The quoted message's id, and its author as the server describes it, for when the message isn't loaded.
    quotedId: string;
    describedUserId?: string;
};

const toQuotedFile = (file: FileModel) => ({mime_type: file.mimeType});

// withQuoted gives a component what it needs to quote a message: the message when it's loaded (with its files), its
// author and how to name them.
export const withQuoted = withObservables(['quotedId', 'describedUserId'], ({database, quotedId, describedUserId}: QuotedArgs) => {
    const quotedPost = observePost(database, quotedId);
    const author = quotedPost.pipe(
        switchMap((p) => {
            const userId = p?.userId || describedUserId;
            return userId ? observeUser(database, userId) : of$(undefined);
        }),
    );
    const quotedFiles = queryFilesForPost(database, quotedId).observe().pipe(
        switchMap((files) => of$(files.map(toQuotedFile))),
    );

    return {
        quotedPost,
        quotedFiles,
        author,
        teammateNameDisplay: observeTeammateNameDisplay(database),
        overrideAllowed: observeConfigBooleanValue(database, 'EnablePostUsernameOverride'),
    };
});
