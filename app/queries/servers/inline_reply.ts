// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {of as of$} from 'rxjs';
import {distinctUntilChanged, switchMap} from 'rxjs/operators';

import {queryPreferencesByCategoryAndName} from '@queries/servers/preference';
import {observeConfigValue} from '@queries/servers/system';
import {MENTION_PREFERENCE_CATEGORY, MENTION_PREFERENCE_NAME} from '@utils/inline_reply';

import type {Database} from '@nozbe/watermelondb';

// Inline replies are an Antimatter feature, on when the server says so: other servers don't send the setting.
export const observeInlineRepliesEnabled = (database: Database) => {
    return observeConfigValue(database, 'EnableInlineReplies').pipe(
        switchMap((v) => of$(v === 'true')),
        distinctUntilChanged(),
    );
};

// observeMentionsQuotedAuthor tells whether the next inline replies notify the quoted message's author, as the
// reader last chose in the reply bar (Fusion's preference); they do by default.
export const observeMentionsQuotedAuthor = (database: Database) => {
    return queryPreferencesByCategoryAndName(database, MENTION_PREFERENCE_CATEGORY, MENTION_PREFERENCE_NAME).
        observeWithColumns(['value']).
        pipe(
            switchMap((prefs) => of$(prefs[0]?.value !== 'false')),
            distinctUntilChanged(),
        );
};
