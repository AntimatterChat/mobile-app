// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {firstValueFrom} from 'rxjs';

import DatabaseManager from '@database/manager';

import {observeAllowPdfLinkNavigation, observeCanDownloadFiles, observeCanUploadFiles, observeEnableSecureFilePreview} from './security';

import type ServerDataOperator from '@database/operator/server_data_operator';
import type {Database} from '@nozbe/watermelondb';

describe('security queries', () => {
    const serverUrl = 'baseHandler.test.com';
    let database: Database;
    let operator: ServerDataOperator;

    beforeEach(async () => {
        await DatabaseManager.init([serverUrl]);
        const serverDatabaseAndOperator = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        database = serverDatabaseAndOperator.database;
        operator = serverDatabaseAndOperator.operator;
    });

    afterEach(async () => {
        await DatabaseManager.destroyServerDatabase(serverUrl);
    });

    const setConfigs = (configs: Array<{id: string; value: string}>) => {
        return operator.handleConfigs({configs, prepareRecordsOnly: false, configsToDelete: []});
    };

    describe('observeCanUploadFiles', () => {
        it('should return true when nothing is configured', async () => {
            expect(await firstValueFrom(observeCanUploadFiles(database))).toBe(true);
        });

        it('should return false if file attachments are disabled', async () => {
            await setConfigs([{id: 'EnableFileAttachments', value: 'false'}, {id: 'EnableMobileFileUpload', value: 'true'}]);
            expect(await firstValueFrom(observeCanUploadFiles(database))).toBe(false);
        });

        it('should return false if mobile file upload is disabled', async () => {
            await setConfigs([{id: 'EnableFileAttachments', value: 'true'}, {id: 'EnableMobileFileUpload', value: 'false'}]);
            expect(await firstValueFrom(observeCanUploadFiles(database))).toBe(false);
        });

        it('should return true if file attachments and mobile file upload are enabled', async () => {
            await setConfigs([{id: 'EnableFileAttachments', value: 'true'}, {id: 'EnableMobileFileUpload', value: 'true'}]);
            expect(await firstValueFrom(observeCanUploadFiles(database))).toBe(true);
        });
    });

    describe('observeCanDownloadFiles', () => {
        it('should return true when EnableMobileFileDownload is not set', async () => {
            expect(await firstValueFrom(observeCanDownloadFiles(database))).toBe(true);
        });

        it('should return false when EnableMobileFileDownload is false', async () => {
            await setConfigs([{id: 'EnableMobileFileDownload', value: 'false'}]);
            expect(await firstValueFrom(observeCanDownloadFiles(database))).toBe(false);
        });

        it('should return true when EnableMobileFileDownload is true', async () => {
            await setConfigs([{id: 'EnableMobileFileDownload', value: 'true'}]);
            expect(await firstValueFrom(observeCanDownloadFiles(database))).toBe(true);
        });
    });

    describe('observeEnableSecureFilePreview', () => {
        it('should return false by default', async () => {
            expect(await firstValueFrom(observeEnableSecureFilePreview(database))).toBe(false);
        });

        it('should return false if MobileEnableSecureFilePreview is false', async () => {
            await setConfigs([{id: 'MobileEnableSecureFilePreview', value: 'false'}]);
            expect(await firstValueFrom(observeEnableSecureFilePreview(database))).toBe(false);
        });

        it('should return true if MobileEnableSecureFilePreview is true', async () => {
            await setConfigs([{id: 'MobileEnableSecureFilePreview', value: 'true'}]);
            expect(await firstValueFrom(observeEnableSecureFilePreview(database))).toBe(true);
        });
    });

    describe('observeAllowPdfLinkNavigation', () => {
        it('should return false by default', async () => {
            expect(await firstValueFrom(observeAllowPdfLinkNavigation(database))).toBe(false);
        });

        it('should return false if MobileAllowPdfLinkNavigation is false', async () => {
            await setConfigs([{id: 'MobileAllowPdfLinkNavigation', value: 'false'}]);
            expect(await firstValueFrom(observeAllowPdfLinkNavigation(database))).toBe(false);
        });

        it('should return true if MobileAllowPdfLinkNavigation is true', async () => {
            await setConfigs([{id: 'MobileAllowPdfLinkNavigation', value: 'true'}]);
            expect(await firstValueFrom(observeAllowPdfLinkNavigation(database))).toBe(true);
        });
    });
});
