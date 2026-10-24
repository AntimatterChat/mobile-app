// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {BehaviorSubject} from 'rxjs';

// SignInStore holds the sign-ins to your account warned of on this device (session_created), newest first, until
// each is handled ("It's me" or "Disconnect") or the server says another device handled it (session_revoked,
// session_acknowledged). Per server: the key is the server url.
class SignInStoreSingleton {
    private subjects: {[serverUrl: string]: BehaviorSubject<SignIn[]>} = {};

    private subject(serverUrl: string) {
        if (!this.subjects[serverUrl]) {
            this.subjects[serverUrl] = new BehaviorSubject<SignIn[]>([]);
        }
        return this.subjects[serverUrl];
    }

    add = (serverUrl: string, signIn: SignIn) => {
        if (!signIn?.session_id) {
            return;
        }
        const list = this.subject(serverUrl).value;
        if (list.some((s) => s.session_id === signIn.session_id)) {
            return;
        }
        this.subject(serverUrl).next([signIn, ...list]);
    };

    remove = (serverUrl: string, sessionId: string) => {
        const list = this.subject(serverUrl).value;
        if (!list.some((s) => s.session_id === sessionId)) {
            return;
        }
        this.subject(serverUrl).next(list.filter((s) => s.session_id !== sessionId));
    };

    observe = (serverUrl: string) => {
        return this.subject(serverUrl).asObservable();
    };

    getState = (serverUrl: string) => {
        return this.subject(serverUrl).value;
    };
}

const SignInStore = new SignInStoreSingleton();
export default SignInStore;
