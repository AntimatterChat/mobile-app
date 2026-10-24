// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@constants/preferences';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import AttachmentChart, {sparkline} from './attachment_chart';

describe('AttachmentChart', () => {
    const theme = Preferences.THEMES.denim;

    it('renders nothing with fewer than two values', () => {
        const {queryByTestId} = renderWithIntlAndTheme(
            <AttachmentChart
                chart={{values: [1]}}
                color='#3E8EDE'
                theme={theme}
            />,
        );
        expect(queryByTestId('attachment_chart')).toBeNull();
    });

    it('renders a chart for two or more values', () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <AttachmentChart
                chart={{values: [3.1, 3.4, 4.0, 4.1]}}
                color='#3E8EDE'
                theme={theme}
            />,
        );
        expect(getByTestId('attachment_chart')).toBeTruthy();
    });

    it('uses the chart label as its accessibility label', () => {
        const {getByLabelText} = renderWithIntlAndTheme(
            <AttachmentChart
                chart={{values: [1, 2, 3], label: 'CPU %'}}
                color='#3E8EDE'
                theme={theme}
            />,
        );
        expect(getByLabelText('CPU %')).toBeTruthy();
    });

    it('ignores non-finite values and caps at 60 points', () => {
        const values = Array.from({length: 80}, (_, i) => i);
        values[5] = Number.NaN;
        const {getByTestId} = renderWithIntlAndTheme(
            <AttachmentChart
                chart={{values}}
                color='#3E8EDE'
                theme={theme}
            />,
        );
        expect(getByTestId('attachment_chart')).toBeTruthy();
    });

    describe('sparkline', () => {
        it('places the threshold line within the box when values stay below it', () => {
            const line = sparkline([1, 2, 3], 10, 100, 72);
            expect(line.threshold).toBeDefined();
            expect(line.threshold).toBeGreaterThanOrEqual(0);
            expect(line.threshold).toBeLessThanOrEqual(72);
        });

        it('omits the threshold when none is given', () => {
            const line = sparkline([1, 2, 3], undefined, 100, 72);
            expect(line.threshold).toBeUndefined();
        });

        it('places the last point at the line\'s final x', () => {
            const line = sparkline([1, 2, 3], undefined, 100, 72);
            expect(line.last.x).toBeCloseTo(92, 0);
        });
    });
});
