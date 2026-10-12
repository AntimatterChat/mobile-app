// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import TestHelper from '@test/test_helper';

import {isAmPluginPost} from './index';

describe('isAmPluginPost', () => {
    it('should render the plugins\' posts natively', () => {
        expect(isAmPluginPost(TestHelper.fakePostModel({type: 'custom_poll'}))).toBe(true);
        expect(isAmPluginPost(TestHelper.fakePostModel({type: ''}))).toBe(false);
    });
});
