// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent} from '@testing-library/react-native';
import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import SignInWarning from './sign_in_warning';

const signIn = (sessionId: string): SignIn => ({
    session_id: sessionId,
    create_at: Date.now(),
    platform: 'Linux',
    os: 'Linux',
    browser: 'Firefox/120.0',
    mobile: false,
});

describe('SignInWarning', () => {
    it('renders nothing when there are no sign-ins', () => {
        const {toJSON} = renderWithIntlAndTheme(
            <SignInWarning
                signIns={[]}
                onItsMe={jest.fn()}
                onDisconnect={jest.fn(() => Promise.resolve(true))}
            />,
        );

        expect(toJSON()).toBeNull();
    });

    it('shows a card per sign-in', () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <SignInWarning
                signIns={[signIn('a'), signIn('b')]}
                onItsMe={jest.fn()}
                onDisconnect={jest.fn(() => Promise.resolve(true))}
            />,
        );

        expect(getByTestId('sign_in_warning.card.a')).toBeVisible();
        expect(getByTestId('sign_in_warning.card.b')).toBeVisible();
    });

    it('shows how many more wait their turn past the limit shown', () => {
        const signIns = [signIn('a'), signIn('b'), signIn('c'), signIn('d')];
        const {getByText} = renderWithIntlAndTheme(
            <SignInWarning
                signIns={signIns}
                onItsMe={jest.fn()}
                onDisconnect={jest.fn(() => Promise.resolve(true))}
            />,
        );

        expect(getByText('1 more sign-in')).toBeVisible();
    });

    it('calls onItsMe with the session id', () => {
        const onItsMe = jest.fn();
        const {getByTestId} = renderWithIntlAndTheme(
            <SignInWarning
                signIns={[signIn('a')]}
                onItsMe={onItsMe}
                onDisconnect={jest.fn(() => Promise.resolve(true))}
            />,
        );

        fireEvent.press(getByTestId('sign_in_warning.card.a.its_me'));
        expect(onItsMe).toHaveBeenCalledWith('a');
    });

    it('calls onDisconnect with the session id', async () => {
        const onDisconnect = jest.fn(() => Promise.resolve(true));
        const {getByTestId} = renderWithIntlAndTheme(
            <SignInWarning
                signIns={[signIn('a')]}
                onItsMe={jest.fn()}
                onDisconnect={onDisconnect}
            />,
        );

        fireEvent.press(getByTestId('sign_in_warning.card.a.disconnect'));
        expect(onDisconnect).toHaveBeenCalledWith('a');
    });
});
