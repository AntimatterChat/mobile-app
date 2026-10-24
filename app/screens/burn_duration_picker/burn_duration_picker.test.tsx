// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent, screen, waitFor} from '@testing-library/react-native';
import React from 'react';

import CallbackStore from '@store/callback_store';
import {renderWithIntl} from '@test/intl-test-helper';

import BurnDurationPicker from './burn_duration_picker';

jest.mock('@screens/navigation', () => ({
    dismissBottomSheet: jest.fn(() => Promise.resolve()),
}));

const defaultBorConfig: PostBoRConfig = {
    enabled: false,
    borDurationSeconds: 600,
    borMaximumTimeToLiveSeconds: 604800,
    borMaximumDurationSeconds: 86400,
};

describe('BurnDurationPicker', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('applies the default off state when nothing is picked', async () => {
        const callback = jest.fn();
        CallbackStore.setCallback(callback);

        renderWithIntl(
            <BurnDurationPicker
                postBoRConfig={{...defaultBorConfig}}
                defaultBorConfig={defaultBorConfig}
            />,
        );

        fireEvent.press(await screen.findByTestId('burn_duration_picker.apply.button'));

        await waitFor(() => {
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({enabled: false}));
        });
    });

    it('picks a stepped duration', async () => {
        const callback = jest.fn();
        CallbackStore.setCallback(callback);

        renderWithIntl(
            <BurnDurationPicker
                postBoRConfig={{...defaultBorConfig}}
                defaultBorConfig={defaultBorConfig}
            />,
        );

        fireEvent.press(screen.getByTestId('burn_duration_picker.900'));
        fireEvent.press(await screen.findByTestId('burn_duration_picker.apply.button'));

        await waitFor(() => {
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({enabled: true, durationSeconds: 900}));
        });
    });

    it('picks a custom duration in minutes', async () => {
        const callback = jest.fn();
        CallbackStore.setCallback(callback);

        renderWithIntl(
            <BurnDurationPicker
                postBoRConfig={{...defaultBorConfig}}
                defaultBorConfig={defaultBorConfig}
            />,
        );

        fireEvent.press(screen.getByTestId('burn_duration_picker.custom'));
        fireEvent.changeText(screen.getByTestId('burn_duration_picker.custom.input'), '45');
        fireEvent.press(await screen.findByTestId('burn_duration_picker.apply.button'));

        await waitFor(() => {
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({enabled: true, durationSeconds: 2700}));
        });
    });

    it('caps a custom duration at the administrator maximum', async () => {
        const callback = jest.fn();
        CallbackStore.setCallback(callback);

        renderWithIntl(
            <BurnDurationPicker
                postBoRConfig={{...defaultBorConfig}}
                defaultBorConfig={defaultBorConfig}
            />,
        );

        fireEvent.press(screen.getByTestId('burn_duration_picker.custom'));
        fireEvent.changeText(screen.getByTestId('burn_duration_picker.custom.input'), '10000');
        fireEvent.press(await screen.findByTestId('burn_duration_picker.apply.button'));

        await waitFor(() => {
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({enabled: true, durationSeconds: 86400}));
        });
    });
});
