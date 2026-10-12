// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent} from '@testing-library/react-native';
import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import SpoilerQuickAction from './index';

describe('SpoilerQuickAction', () => {
    it('should turn the spoiler on and off', () => {
        const updateSpoiler = jest.fn();
        const {getByTestId, rerender} = renderWithIntlAndTheme(
            <SpoilerQuickAction
                testID='spoiler_action'
                isSpoiler={false}
                updateSpoiler={updateSpoiler}
            />,
        );

        fireEvent.press(getByTestId('spoiler_action'));
        expect(updateSpoiler).toHaveBeenLastCalledWith(true);

        rerender(
            <SpoilerQuickAction
                testID='spoiler_action'
                isSpoiler={true}
                updateSpoiler={updateSpoiler}
            />,
        );
        fireEvent.press(getByTestId('spoiler_action'));
        expect(updateSpoiler).toHaveBeenLastCalledWith(false);
    });
});
