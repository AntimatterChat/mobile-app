// Copyright (c) 2026-present Antimatter contributors. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Ellipse} from 'react-native-svg';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import LaunchLoader from './launch_loader';

import AntimatterLogo, {ANTIMATTER_MARK_COLORS} from '.';

const mockUseReducedMotion = jest.fn(() => false);
const mockWithRepeat = jest.fn();

jest.mock('react-native-reanimated', () => {
    const actual = jest.requireActual('react-native-reanimated');
    return {
        __esModule: true,
        ...actual,
        useReducedMotion: () => mockUseReducedMotion(),
        withRepeat: (...args: unknown[]) => {
            mockWithRepeat(...args);
            return actual.withRepeat(...args);
        },
    };
});

describe('AntimatterLogo', () => {
    beforeEach(() => {
        mockUseReducedMotion.mockReturnValue(false);
        mockWithRepeat.mockClear();
    });

    it('draws the mark at the requested size, with an accessible label', () => {
        const {getByTestId, getByLabelText} = renderWithIntlAndTheme(
            <AntimatterLogo
                size={56}
                testID='logo'
            />,
        );

        expect(getByTestId('logo')).toHaveStyle({width: 56, height: 56});
        expect(getByLabelText('Antimatter')).toBeTruthy();
    });

    it('uses the light colours on a light theme and the dark ones when asked', () => {
        const light = renderWithIntlAndTheme(<AntimatterLogo/>);
        // eslint-disable-next-line new-cap
        expect(light.UNSAFE_getAllByType(Ellipse).map((e) => e.props.stroke)).toEqual([
            ANTIMATTER_MARK_COLORS.light.matter,
            ANTIMATTER_MARK_COLORS.light.anti,
        ]);

        const dark = renderWithIntlAndTheme(<AntimatterLogo variant='dark'/>);
        // eslint-disable-next-line new-cap
        expect(dark.UNSAFE_getAllByType(Ellipse).map((e) => e.props.stroke)).toEqual([
            ANTIMATTER_MARK_COLORS.dark.matter,
            ANTIMATTER_MARK_COLORS.dark.anti,
        ]);
    });

    it('starts the orbit animation only when animated and motion is allowed', () => {
        renderWithIntlAndTheme(<AntimatterLogo/>);
        expect(mockWithRepeat).not.toHaveBeenCalled();

        renderWithIntlAndTheme(<AntimatterLogo animated={true}/>);
        expect(mockWithRepeat).toHaveBeenCalled();
    });

    it('stays still when the system asks to reduce motion', () => {
        mockUseReducedMotion.mockReturnValue(true);

        renderWithIntlAndTheme(<AntimatterLogo animated={true}/>);
        expect(mockWithRepeat).not.toHaveBeenCalled();
    });

    it('renders the launch loader with the animated mark', () => {
        const {getByTestId, getByLabelText} = renderWithIntlAndTheme(<LaunchLoader/>);

        expect(getByTestId('launch_loader')).toBeTruthy();
        expect(getByLabelText('Antimatter')).toBeTruthy();
    });
});
