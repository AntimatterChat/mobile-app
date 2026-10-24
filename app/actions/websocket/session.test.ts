// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import SignInStore from '@store/sign_in_store';

import {handleSessionAcknowledgedEvent, handleSessionCreatedEvent, handleSessionRevokedEvent} from './session';

jest.mock('@store/sign_in_store', () => ({
    add: jest.fn(),
    remove: jest.fn(),
}));

const serverUrl = 'session.test.com';

describe('handleSessionCreatedEvent', () => {
    const mockedAdd = jest.mocked(SignInStore.add);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('adds the sign-in to the store', () => {
        const signIn: SignIn = {
            session_id: 'session-1',
            create_at: 1000,
            platform: 'Linux',
            os: 'Linux',
            browser: 'Firefox/120.0',
            mobile: false,
        };

        handleSessionCreatedEvent(serverUrl, {data: signIn} as WebSocketMessage);

        expect(mockedAdd).toHaveBeenCalledWith(serverUrl, signIn);
    });
});

describe('handleSessionRevokedEvent', () => {
    const mockedRemove = jest.mocked(SignInStore.remove);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('removes the sign-in from the store', () => {
        handleSessionRevokedEvent(serverUrl, {data: {session_id: 'session-1'}} as WebSocketMessage);

        expect(mockedRemove).toHaveBeenCalledWith(serverUrl, 'session-1');
    });

    it('does nothing without a session id', () => {
        handleSessionRevokedEvent(serverUrl, {data: {}} as WebSocketMessage);

        expect(mockedRemove).not.toHaveBeenCalled();
    });
});

describe('handleSessionAcknowledgedEvent', () => {
    const mockedRemove = jest.mocked(SignInStore.remove);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('removes the sign-in from the store', () => {
        handleSessionAcknowledgedEvent(serverUrl, {data: {session_id: 'session-1'}} as WebSocketMessage);

        expect(mockedRemove).toHaveBeenCalledWith(serverUrl, 'session-1');
    });

    it('does nothing without a session id', () => {
        handleSessionAcknowledgedEvent(serverUrl, {data: {}} as WebSocketMessage);

        expect(mockedRemove).not.toHaveBeenCalled();
    });
});
