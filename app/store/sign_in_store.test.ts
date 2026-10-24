// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import SignInStore from './sign_in_store';

const SERVER_URL = 'https://appv1.mattermost.com';

const signIn = (sessionId: string): SignIn => ({
    session_id: sessionId,
    create_at: Date.now(),
    platform: 'Linux',
    os: 'Linux',
    browser: 'Firefox/120.0',
    mobile: false,
});

describe('SignInStore', () => {
    afterEach(() => {
        SignInStore.getState(SERVER_URL).forEach((s) => SignInStore.remove(SERVER_URL, s.session_id));
    });

    it('starts empty', () => {
        expect(SignInStore.getState(SERVER_URL)).toEqual([]);
    });

    it('adds a sign-in, newest first', () => {
        SignInStore.add(SERVER_URL, signIn('a'));
        SignInStore.add(SERVER_URL, signIn('b'));
        expect(SignInStore.getState(SERVER_URL).map((s) => s.session_id)).toEqual(['b', 'a']);
    });

    it('ignores a sign-in already known', () => {
        SignInStore.add(SERVER_URL, signIn('a'));
        SignInStore.add(SERVER_URL, signIn('a'));
        expect(SignInStore.getState(SERVER_URL)).toHaveLength(1);
    });

    it('ignores a sign-in with no session id', () => {
        SignInStore.add(SERVER_URL, {} as SignIn);
        expect(SignInStore.getState(SERVER_URL)).toEqual([]);
    });

    it('removes a sign-in', () => {
        SignInStore.add(SERVER_URL, signIn('a'));
        SignInStore.add(SERVER_URL, signIn('b'));
        SignInStore.remove(SERVER_URL, 'a');
        expect(SignInStore.getState(SERVER_URL).map((s) => s.session_id)).toEqual(['b']);
    });

    it('does nothing when removing one not known', () => {
        SignInStore.add(SERVER_URL, signIn('a'));
        const listener = jest.fn();
        const subscription = SignInStore.observe(SERVER_URL).subscribe(listener);
        listener.mockClear();

        SignInStore.remove(SERVER_URL, 'not-there');
        expect(listener).not.toHaveBeenCalled();

        subscription.unsubscribe();
    });
});
