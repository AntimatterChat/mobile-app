// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import {DynamicTimestamp} from './index';

describe('DynamicTimestamp', () => {
    it('should show the timestamp in the reader\'s time zone and clock', () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <DynamicTimestamp
                seconds={1700000000}
                timestampStyle='t'
                literal='<t:1700000000:t>'
                textStyle={{}}
                readerZone='Asia/Tokyo'
                isMilitaryTime={true}
            />,
        );

        expect(getByTestId('markdown_timestamp')).toHaveTextContent('07:13');
        expect(getByTestId('markdown_timestamp').props.accessibilityLabel.replace(/\s/g, ' ')).toBe('Wednesday, November 15, 2023 at 07:13');
    });
});
