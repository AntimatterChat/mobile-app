// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {of as of$, combineLatest} from 'rxjs';
import {switchMap, distinctUntilChanged} from 'rxjs/operators';

import {observeConfigBooleanValue} from './system';

import type {Database} from '@nozbe/watermelondb';

export const observeCanUploadFiles = (database: Database) => {
    const enableFileAttachments = observeConfigBooleanValue(database, 'EnableFileAttachments', true);
    const enableMobileFileUpload = observeConfigBooleanValue(database, 'EnableMobileFileUpload', true);

    return combineLatest([enableFileAttachments, enableMobileFileUpload]).pipe(
        switchMap(([efa, emfu]) => of$(efa && emfu)),
        distinctUntilChanged(),
    );
};

export const observeCanDownloadFiles = (database: Database) => {
    return observeConfigBooleanValue(database, 'EnableMobileFileDownload', true);
};

export const observeEnableSecureFilePreview = (database: Database) => {
    return observeConfigBooleanValue(database, 'MobileEnableSecureFilePreview', false);
};

export const observeAllowPdfLinkNavigation = (database: Database) => {
    return observeConfigBooleanValue(database, 'MobileAllowPdfLinkNavigation', false);
};
