// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import SignInStore from '@store/sign_in_store';
import {logError} from '@utils/log';

// handleSessionCreatedEvent warns the user of a new sign-in to their account, on any of their devices (their own
// phone included), while they're connected.
export function handleSessionCreatedEvent(serverUrl: string, msg: WebSocketMessage) {
    try {
        const signIn = msg.data as SignIn;
        SignInStore.add(serverUrl, signIn);
    } catch (error) {
        logError('Failed handleSessionCreatedEvent', error);
    }
}

// handleSessionRevokedEvent takes a sign-in warning off every one of the user's devices once any of them disconnects
// that session ("Disconnect"), or the session ends another way.
export function handleSessionRevokedEvent(serverUrl: string, msg: WebSocketMessage) {
    try {
        const sessionId: string = msg.data?.session_id;
        if (sessionId) {
            SignInStore.remove(serverUrl, sessionId);
        }
    } catch (error) {
        logError('Failed handleSessionRevokedEvent', error);
    }
}

// handleSessionAcknowledgedEvent takes a sign-in warning off every one of the user's devices once any of them
// confirms it was them ("It's me").
export function handleSessionAcknowledgedEvent(serverUrl: string, msg: WebSocketMessage) {
    try {
        const sessionId: string = msg.data?.session_id;
        if (sessionId) {
            SignInStore.remove(serverUrl, sessionId);
        }
    } catch (error) {
        logError('Failed handleSessionAcknowledgedEvent', error);
    }
}
