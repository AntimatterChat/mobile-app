// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import {Walltime} from './index';

describe('Walltime', () => {
    // 3pm in Paris on Friday, October 9 2026.
    const props = {
        literal: '3pm CET',
        start: Date.UTC(2026, 9, 9, 13, 0),
        zone: 'Europe/Paris',
        explicit: true,
        textStyle: {},
        isMilitaryTime: false,
        walltimesEnabled: true,
    };

    beforeAll(() => {
        jest.useFakeTimers({doNotFake: ['nextTick'], now: Date.UTC(2026, 9, 9, 8, 0)});
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should add the reader\'s time to a time written in another zone', () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <Walltime
                {...props}
                readerZone='America/New_York'
            />,
        );

        expect(getByTestId('markdown_walltime')).toHaveTextContent(/^3pm CET \(.? 9:00 AM EDT\)$/u);
    });

    it('should leave it as written when turned off', () => {
        const {queryByTestId, getByText} = renderWithIntlAndTheme(
            <Walltime
                {...props}
                readerZone='America/New_York'
                walltimesEnabled={false}
            />,
        );

        expect(queryByTestId('markdown_walltime')).toBeNull();
        expect(getByText('3pm CET')).toBeTruthy();
    });

    it('should leave a time written without a zone as it is for readers of the author\'s zone', () => {
        const {queryByTestId} = renderWithIntlAndTheme(
            <Walltime
                {...props}
                literal='3pm'
                explicit={false}
                readerZone='Europe/Berlin'
            />,
        );

        expect(queryByTestId('markdown_walltime')).toBeNull();
    });
});
