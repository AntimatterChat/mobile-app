// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import Sparkline from './sparkline';

describe('Sparkline', () => {
    it('renders nothing with fewer than two points', () => {
        const {queryByTestId} = renderWithIntlAndTheme(
            <Sparkline
                data={[1]}
                testID='sparkline'
            />,
        );
        expect(queryByTestId('sparkline')).toBeNull();
    });

    it('renders nothing without data', () => {
        const {queryByTestId} = renderWithIntlAndTheme(
            <Sparkline
                data={[]}
                testID='sparkline'
            />,
        );
        expect(queryByTestId('sparkline')).toBeNull();
    });

    it('renders a line for two or more points', () => {
        const {queryByTestId} = renderWithIntlAndTheme(
            <Sparkline
                data={[1, 5, 3, 8, 2]}
                testID='sparkline'
            />,
        );
        expect(queryByTestId('sparkline')).toBeTruthy();
    });

    it('handles a flat series (no range) without dividing by zero', () => {
        const {queryByTestId} = renderWithIntlAndTheme(
            <Sparkline
                data={[4, 4, 4]}
                testID='sparkline'
            />,
        );
        expect(queryByTestId('sparkline')).toBeTruthy();
    });
});
