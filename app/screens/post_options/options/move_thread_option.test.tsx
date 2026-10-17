// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {Screens} from '@constants';
import {dismissBottomSheet, navigateToScreen} from '@screens/navigation';
import {fireEvent, renderWithIntl, waitFor} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import MoveThreadOption from './move_thread_option';

jest.mock('@screens/navigation', () => ({
    dismissBottomSheet: jest.fn().mockResolvedValue(undefined),
    navigateToScreen: jest.fn(),
}));

describe('MoveThreadOption', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should move the thread a first message starts', async () => {
        const post = TestHelper.fakePostModel({id: 'root', rootId: '', channelId: 'town'});
        const {getByText, getByTestId} = renderWithIntl(<MoveThreadOption post={post}/>);

        expect(getByText('Move thread…')).toBeTruthy();
        fireEvent.press(getByTestId('post_options.move_thread.option'));
        await waitFor(() => expect(navigateToScreen).toHaveBeenCalledWith(Screens.MOVE_THREAD, {rootId: 'root', channelId: 'town'}));
        expect(dismissBottomSheet).toHaveBeenCalled();
    });

    it('should move the whole thread from a reply', async () => {
        const post = TestHelper.fakePostModel({id: 'reply', rootId: 'root', channelId: 'town'});
        const {getByTestId} = renderWithIntl(<MoveThreadOption post={post}/>);

        fireEvent.press(getByTestId('post_options.move_thread.option'));
        await waitFor(() => expect(navigateToScreen).toHaveBeenCalledWith(Screens.MOVE_THREAD, {rootId: 'root', channelId: 'town'}));
    });
});
