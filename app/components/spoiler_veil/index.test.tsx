// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent} from '@testing-library/react-native';
import React from 'react';
import {Text} from 'react-native';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import SpoilerVeil from './index';

describe('SpoilerVeil', () => {
    it('should show what it holds when not hidden', () => {
        const {getByText, queryByTestId} = renderWithIntlAndTheme(
            <SpoilerVeil hidden={false}>
                <Text>{'The butler did it'}</Text>
            </SpoilerVeil>,
        );

        expect(getByText('The butler did it')).toBeVisible();
        expect(queryByTestId('spoiler_veil.cover')).toBeNull();
    });

    it('should cover what it holds when hidden, out of reach of screen readers', () => {
        const {getByTestId, getByText, queryByText} = renderWithIntlAndTheme(
            <SpoilerVeil hidden={true}>
                <Text>{'The butler did it'}</Text>
            </SpoilerVeil>,
        );

        const cover = getByTestId('spoiler_veil.cover');
        expect(cover).toHaveProp('accessibilityLabel', 'Spoiler, tap to show it');
        expect(cover).toHaveProp('pointerEvents', 'none');

        // The text is laid out, so that showing it moves nothing, but can't be seen or read out.
        expect(getByText('The butler did it', {includeHiddenElements: true})).not.toBeVisible();
        expect(queryByText('The butler did it')).toBeNull();
    });

    it('should show the spoiler when its cover is tapped, when it can be', () => {
        const onShow = jest.fn();
        const {getByTestId} = renderWithIntlAndTheme(
            <SpoilerVeil
                hidden={true}
                onShow={onShow}
            >
                <Text>{'The butler did it'}</Text>
            </SpoilerVeil>,
        );

        fireEvent.press(getByTestId('spoiler_veil.cover'));
        expect(onShow).toHaveBeenCalledTimes(1);
    });
});
