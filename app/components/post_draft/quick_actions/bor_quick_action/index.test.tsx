// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent, waitFor} from '@testing-library/react-native';
import React from 'react';

import {Screens} from '@constants';
import {useKeyboardState} from '@context/keyboard_state';
import {navigateToScreen} from '@screens/navigation';
import CallbackStore from '@store/callback_store';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

// The presentational component, not the connected './index': these tests cover BoRQuickAction's own behaviour
// (callbacks, navigation), not the live config it's wired to via withObservables/withDatabase in index.ts, so they
// render it without a database and pass defaultBorConfig directly, the way the connected component would supply it.
import BoRQuickAction from './bor_quick_action';

jest.mock('@context/keyboard_state', () => ({
    useKeyboardState: jest.fn(),
}));

jest.mock('@screens/navigation', () => ({
    navigateToScreen: jest.fn(),
}));

jest.mock('@store/callback_store', () => ({
    setCallback: jest.fn(),
    getCallback: jest.fn(),
    removeCallback: jest.fn(),
}));

describe('BoRQuickAction', () => {
    const mockBlurAndDismissKeyboard = jest.fn(() => Promise.resolve());
    const mockUseKeyboardState = jest.mocked(useKeyboardState);
    const mockNavigateToScreen = jest.mocked(navigateToScreen);
    const mockSetCallback = jest.mocked(CallbackStore.setCallback);

    const baseProps = {
        testId: 'bor_quick_action',
        postBoRConfig: undefined,
        updatePostBoRStatus: jest.fn(),
        defaultBorConfig: {
            enabled: false,
            borDurationSeconds: 300,
            borMaximumTimeToLiveSeconds: 3600,
            borMaximumDurationSeconds: 86400,
        } as PostBoRConfig,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseKeyboardState.mockReturnValue({
            blurAndDismissKeyboard: mockBlurAndDismissKeyboard,
        } as unknown as ReturnType<typeof useKeyboardState>);
    });

    it('renders the BoR quick action button', () => {
        const {getByTestId} = renderWithIntlAndTheme(<BoRQuickAction {...baseProps}/>);

        expect(getByTestId('bor_quick_action')).toBeVisible();
    });

    it('opens the duration picker with the default config when postBoRConfig is undefined', async () => {
        const {getByTestId} = renderWithIntlAndTheme(<BoRQuickAction {...baseProps}/>);

        fireEvent.press(getByTestId('bor_quick_action'));

        await waitFor(() => {
            expect(mockBlurAndDismissKeyboard).toHaveBeenCalledTimes(1);
            expect(mockSetCallback).toHaveBeenCalledWith(baseProps.updatePostBoRStatus);
            expect(mockNavigateToScreen).toHaveBeenCalledWith(Screens.BURN_DURATION_PICKER, {
                postBoRConfig: baseProps.defaultBorConfig,
                defaultBorConfig: baseProps.defaultBorConfig,
            });
        });
    });

    it('opens the duration picker with the draft config when postBoRConfig is set', async () => {
        const postBoRConfig: PostBoRConfig = {
            enabled: true,
            borDurationSeconds: 300,
            borMaximumTimeToLiveSeconds: 3600,
            borMaximumDurationSeconds: 86400,
            durationSeconds: 900,
        };
        const {getByTestId} = renderWithIntlAndTheme(
            <BoRQuickAction
                {...baseProps}
                postBoRConfig={postBoRConfig}
            />,
        );

        fireEvent.press(getByTestId('bor_quick_action'));

        await waitFor(() => {
            expect(mockNavigateToScreen).toHaveBeenCalledWith(Screens.BURN_DURATION_PICKER, {
                postBoRConfig,
                defaultBorConfig: baseProps.defaultBorConfig,
            });
        });
    });
});
