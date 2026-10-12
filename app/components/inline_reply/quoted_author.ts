// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useEffect} from 'react';
import {useIntl} from 'react-intl';

import {fetchMissingProfilesByIds} from '@actions/remote/user';
import {useServerUrl} from '@context/server';
import {displayUsername} from '@utils/user';

import type UserModel from '@typings/database/models/servers/user';
import type {Quoted} from '@utils/inline_reply';

// useQuotedAuthorName is the name to show for a quoted message's author: the webhook's name when it overrides it, else
// the author's display name, or '' while the author isn't loaded, which it then is.
export function useQuotedAuthorName(quoted: Quoted, author: UserModel | undefined, teammateNameDisplay: string, overrideAllowed: boolean): string {
    const serverUrl = useServerUrl();
    const intl = useIntl();
    const userId = quoted.deleted ? undefined : quoted.userId;

    useEffect(() => {
        if (userId && !author) {
            fetchMissingProfilesByIds(serverUrl, [userId]);
        }
    }, [serverUrl, userId, author]);

    if (quoted.deleted) {
        return '';
    }
    if (overrideAllowed && quoted.overrideUsername) {
        return quoted.overrideUsername;
    }
    return author ? displayUsername(author, intl.locale, teammateNameDisplay) : '';
}
