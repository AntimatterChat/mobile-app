// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withObservables} from '@nozbe/watermelondb/react';
import {combineLatestWith, of as of$} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {MANAGED_LOCAL_CATEGORY_PREFIX} from '@constants/categories';
import {withServerUrl} from '@context/server';
import {observeCanViewArchivedChannels, observeCurrentChannelId} from '@queries/servers/system';
import {observeServerCategoryLocked} from '@store/server_categories_store';

import CategoryHeader from './header';

import type CategoryModel from '@typings/database/models/servers/category';

const enhanced = withObservables(['category'], ({category, serverUrl}: {category: CategoryModel; serverUrl: string}) => {
    const managed = category.id.startsWith(MANAGED_LOCAL_CATEGORY_PREFIX);

    const canViewArchived = observeCanViewArchivedChannels(category.database);
    const currentChannelId = observeCurrentChannelId(category.database);

    return {
        category,
        managed: of$(managed),
        locked: managed ? observeServerCategoryLocked(serverUrl, category.teamId, category.displayName) : of$(false),
        hasChannels: canViewArchived.pipe(
            combineLatestWith(currentChannelId),
            switchMap(([canView, channelId]) => category.observeHasChannels(canView, channelId)),
        ),
    };
});

export default withServerUrl(enhanced(CategoryHeader));
