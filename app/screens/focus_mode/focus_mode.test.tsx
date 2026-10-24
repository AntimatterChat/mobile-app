// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent, screen, waitFor} from '@testing-library/react-native';
import React from 'react';

import {startFocus} from '@actions/remote/focus';
import {renderWithIntl} from '@test/intl-test-helper';

import FocusMode from './focus_mode';

jest.mock('@actions/remote/focus', () => ({
    startFocus: jest.fn(() => Promise.resolve({state: {active: true, start_at: 0, end_at: 0, reason: '', ended_at: 0}})),
}));

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => 'focus_mode.test.com'),
}));

jest.mock('@screens/navigation', () => ({
    dismissBottomSheet: jest.fn(() => Promise.resolve()),
}));

describe('FocusMode', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('starts focus mode for the duration chosen (1 h, the default)', async () => {
        renderWithIntl(<FocusMode/>);

        fireEvent.press(await screen.findByText('Start'));

        await waitFor(() => {
            expect(startFocus).toHaveBeenCalledWith('focus_mode.test.com', {duration: '1h', reason: ''});
        });
    });

    it('starts focus mode with the reason typed', async () => {
        renderWithIntl(<FocusMode/>);

        fireEvent.changeText(screen.getByTestId('focus_mode.reason.input'), 'Working on the release');
        fireEvent.press(await screen.findByText('Start'));

        await waitFor(() => {
            expect(startFocus).toHaveBeenCalledWith('focus_mode.test.com', {duration: '1h', reason: 'Working on the release'});
        });
    });

    it('switches to a different duration chip', async () => {
        renderWithIntl(<FocusMode/>);

        fireEvent.press(screen.getByTestId('focus_mode.duration.30m'));
        fireEvent.press(await screen.findByText('Start'));

        await waitFor(() => {
            expect(startFocus).toHaveBeenCalledWith('focus_mode.test.com', {duration: '30m', reason: ''});
        });
    });

    it('closes without starting focus mode on Cancel', async () => {
        renderWithIntl(<FocusMode/>);

        fireEvent.press(await screen.findByText('Cancel'));

        expect(startFocus).not.toHaveBeenCalled();
    });
});
