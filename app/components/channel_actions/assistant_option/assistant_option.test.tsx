// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {goToAssistant} from '@assistant/screens/navigation';
import {fireEvent} from '@testing-library/react-native';
import React from 'react';

import {dismissBottomSheet} from '@screens/navigation';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import AssistantOption from './assistant_option';

jest.mock('@assistant/screens/navigation');
jest.mock('@screens/navigation', () => ({
    dismissBottomSheet: jest.fn(() => Promise.resolve()),
}));

describe('AssistantOption', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('opens the Assistant screen for the channel as a label (quick actions)', async () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <AssistantOption
                channelId='channel1'
                showAsLabel={true}
                testID='channel.quick_actions.assistant'
            />,
        );

        fireEvent.press(getByTestId('channel.quick_actions.assistant'));
        await Promise.resolve();

        expect(dismissBottomSheet).toHaveBeenCalled();
        expect(goToAssistant).toHaveBeenCalledWith('channel1');
    });

    it('opens the Assistant screen for the channel as an option item', async () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <AssistantOption
                channelId='channel1'
                testID='channel_info.assistant'
            />,
        );

        fireEvent.press(getByTestId('channel_info.assistant'));
        await Promise.resolve();

        expect(goToAssistant).toHaveBeenCalledWith('channel1');
    });
});
