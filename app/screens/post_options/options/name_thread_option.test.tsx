// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {Screens} from '@constants';
import {navigateToScreen} from '@screens/navigation';
import {fireEvent, renderWithIntl, waitFor} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import NameThreadOption from './name_thread_option';

jest.mock('@screens/navigation', () => ({
    dismissBottomSheet: jest.fn().mockResolvedValue(undefined),
    navigateToScreen: jest.fn(),
}));

describe('NameThreadOption', () => {
    it('should name a thread', async () => {
        const post = TestHelper.fakePostModel({id: 'root', props: {}});
        const {getByText, getByTestId} = renderWithIntl(<NameThreadOption post={post}/>);

        expect(getByText('Name thread…')).toBeTruthy();
        fireEvent.press(getByTestId('post_options.name_thread.option'));
        await waitFor(() => expect(navigateToScreen).toHaveBeenCalledWith(Screens.NAME_THREAD, {rootId: 'root', currentTitle: ''}));
    });

    it('should rename a named thread', () => {
        const post = TestHelper.fakePostModel({id: 'root', props: {am_thread_title: 'Release'}});
        const {getByText} = renderWithIntl(<NameThreadOption post={post}/>);

        expect(getByText('Rename thread…')).toBeTruthy();
    });
});
