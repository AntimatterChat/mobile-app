// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$} from 'rxjs';
import {combineLatestWith, switchMap} from 'rxjs/operators';

import {withServerUrl} from '@context/server';
import {observeIsChannelFavorited, observeManagedCategoryForChannel} from '@queries/servers/categories';
import {observeChannel} from '@queries/servers/channel';
import {observeCurrentTeamId} from '@queries/servers/system';
import {observeServerCategoryLocked} from '@store/server_categories_store';

import FavoriteBox from './favorite_box';

import type {Database} from '@nozbe/watermelondb';
import type {WithDatabaseArgs} from '@typings/database/database';

type OwnProps = WithDatabaseArgs & {
    channelId: string;
    serverUrl: string;
}

const observeInLockedCategory = (database: Database, serverUrl: string, teamId: string, channelId: string) => {
    return observeManagedCategoryForChannel(database, teamId, channelId).pipe(
        switchMap((category) => (category ? observeServerCategoryLocked(serverUrl, teamId, category.displayName) : of$(false))),
    );
};

const enhanced = withObservables(['channelId'], ({channelId, database, serverUrl}: OwnProps) => {
    const currentTeamId = observeCurrentTeamId(database);
    const channel = observeChannel(database, channelId);
    const isFavorited = channel.pipe(
        combineLatestWith(currentTeamId),
        switchMap(([c, tId]) => observeIsChannelFavorited(database, c?.teamId || tId, channelId)),
    );

    // A channel of a managed category can't be moved to the favourites when the category keeps its channels: always,
    // or on Antimatter servers when the admins locked it.
    const isManaged = channel.pipe(
        combineLatestWith(currentTeamId),
        switchMap(([c, tId]) => observeInLockedCategory(database, serverUrl, c?.teamId || tId, channelId)),
    );

    return {
        isFavorited,
        isManaged,
    };
});

export default withDatabase(withServerUrl(enhanced(FavoriteBox)));
