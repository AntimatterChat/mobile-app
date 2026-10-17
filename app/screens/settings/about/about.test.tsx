// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Clipboard from '@react-native-clipboard/clipboard';
import {fireEvent, screen} from '@testing-library/react-native';
import React from 'react';

import {COMPATIBLE_MATTERMOST_MOBILE_VERSION} from '@constants/versions';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import About from './about';

jest.mock('expo-application', () => ({
    applicationId: 'chat.antimatter.app',
    nativeApplicationVersion: '0.9.0',
    nativeBuildVersion: '821',
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
    setString: jest.fn(),
}));
jest.mock('@components/antimatter_logo', () => () => null);
jest.mock('@components/settings/container', () => ({children}: {children: unknown}) => children);
jest.mock('@hooks/android_back_handler', () => jest.fn());
jest.mock('@hooks/utils', () => ({
    usePreventDoubleTap: jest.fn((callback) => callback),
}));
jest.mock('@screens/navigation');
jest.mock('@utils/snack_bar', () => ({
    showSnackBar: jest.fn(),
}));
jest.mock('./learn_more', () => () => null);
jest.mock('./subtitle', () => () => null);
jest.mock('./title', () => () => null);
jest.mock('./tos_privacy', () => () => null);

const config = {
    Version: '11.0.0',
    BuildNumber: '11.0.0',
    SQLDriverName: 'postgres',
    SchemaVersion: '150',
    BuildHash: 'abc',
} as ClientConfig;

// People see Antimatter's own version; only the servers get the Mattermost-compatible one
describe('screens/settings/about', () => {
    it('shows the Antimatter version, not the Mattermost-compatible one', () => {
        renderWithIntlAndTheme(<About config={config}/>);

        const value = screen.getByTestId('about.app_version.value');
        expect(value).toHaveTextContent('0.9.0 (Build 821)');
        expect(value).not.toHaveTextContent(COMPATIBLE_MATTERMOST_MOBILE_VERSION);
    });

    it('copies the Antimatter version', () => {
        renderWithIntlAndTheme(<About config={config}/>);

        fireEvent.press(screen.getByTestId('about.copy_info'));

        const copied = jest.mocked(Clipboard.setString).mock.calls[0][0];
        expect(copied).toContain('App Version: 0.9.0 (Build 821)');
        expect(copied).not.toContain(COMPATIBLE_MATTERMOST_MOBILE_VERSION);
    });
});
