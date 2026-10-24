// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent, waitFor} from '@testing-library/react-native';
import React from 'react';

import {acknowledgeOwnSession, revokeOwnSession} from '@actions/remote/session';
import {SYSTEM_IDENTIFIERS} from '@constants/database';
import SignInStore from '@store/sign_in_store';
import {renderWithEverything} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import SignInWarningContainer from './index';

import type ServerDataOperator from '@database/operator/server_data_operator';
import type {Database} from '@nozbe/watermelondb';

const SERVER_URL = 'sign_in_warning.test.com';
const USER_ID = 'user-1';

jest.mock('@actions/remote/session', () => ({
    acknowledgeOwnSession: jest.fn(() => Promise.resolve({})),
    revokeOwnSession: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => 'sign_in_warning.test.com'),
}));

const signIn = (sessionId: string): SignIn => ({
    session_id: sessionId,
    create_at: Date.now(),
    platform: 'Linux',
    os: 'Linux',
    browser: 'Firefox/120.0',
    mobile: false,
});

describe('SignInWarningContainer', () => {
    let database: Database;

    beforeEach(async () => {
        const server = await TestHelper.setupServerDatabase(SERVER_URL);
        database = server.database;
        const operator: ServerDataOperator = server.operator;
        await operator.handleSystem({systems: [{id: SYSTEM_IDENTIFIERS.CURRENT_USER_ID, value: USER_ID}], prepareRecordsOnly: false});
        SignInStore.getState(SERVER_URL).forEach((s) => SignInStore.remove(SERVER_URL, s.session_id));
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await TestHelper.tearDown();
    });

    it('shows the sign-ins from the store', () => {
        SignInStore.add(SERVER_URL, signIn('a'));

        const {getByTestId} = renderWithEverything(<SignInWarningContainer/>, {database});

        expect(getByTestId('sign_in_warning.card.a')).toBeVisible();
    });

    it('acknowledges and removes a sign-in on "It\'s me"', async () => {
        SignInStore.add(SERVER_URL, signIn('a'));

        const {getByTestId, queryByTestId} = renderWithEverything(<SignInWarningContainer/>, {database});

        fireEvent.press(getByTestId('sign_in_warning.card.a.its_me'));

        await waitFor(() => {
            expect(acknowledgeOwnSession).toHaveBeenCalledWith(SERVER_URL, USER_ID, 'a');
            expect(queryByTestId('sign_in_warning.card.a')).toBeNull();
        });
    });

    it('revokes and removes a sign-in on "Disconnect"', async () => {
        SignInStore.add(SERVER_URL, signIn('a'));
        jest.mocked(revokeOwnSession).mockResolvedValueOnce({});

        const {getByTestId, queryByTestId} = renderWithEverything(<SignInWarningContainer/>, {database});

        fireEvent.press(getByTestId('sign_in_warning.card.a.disconnect'));

        await waitFor(() => {
            expect(revokeOwnSession).toHaveBeenCalledWith(SERVER_URL, USER_ID, 'a');
            expect(queryByTestId('sign_in_warning.card.a')).toBeNull();
        });
    });
});
