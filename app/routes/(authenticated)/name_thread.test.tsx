// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {useNavigationHeader} from '@hooks/navigation_header';
import {usePropsFromParams} from '@hooks/props_from_params';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import NameThreadRoute from './name_thread';

jest.mock('@hooks/navigation_header', () => ({
    getHeaderOptions: jest.fn(() => ({})),
    useNavigationHeader: jest.fn(),
}));

jest.mock('@hooks/props_from_params', () => ({
    usePropsFromParams: jest.fn(),
}));

jest.mock('@screens/name_thread', () => ({
    __esModule: true,
    default: () => null,
}));

// Named threads are topics in Antimatter, as in Fusion.
describe('NameThreadRoute', () => {
    const headerTitle = () => jest.mocked(useNavigationHeader).mock.lastCall?.[0].headerOptions?.headerTitle;

    it('should make a thread a topic', () => {
        jest.mocked(usePropsFromParams).mockReturnValue({rootId: 'root-id', currentTitle: ''});
        renderWithIntlAndTheme(<NameThreadRoute/>);
        expect(headerTitle()).toBe('Make it a topic');
    });

    it('should rename a topic', () => {
        jest.mocked(usePropsFromParams).mockReturnValue({rootId: 'root-id', currentTitle: 'Release'});
        renderWithIntlAndTheme(<NameThreadRoute/>);
        expect(headerTitle()).toBe('Rename the topic');
    });
});
