// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import TestHelper from '@test/test_helper';

import {isAmPluginPost} from './index';

describe('isAmPluginPost', () => {
    it('should render the plugins\' posts natively', () => {
        expect(isAmPluginPost(TestHelper.fakePostModel({type: 'custom_poll'}))).toBe(true);
        expect(isAmPluginPost(TestHelper.fakePostModel({type: 'custom_antimatter_note'}))).toBe(true);
        expect(isAmPluginPost(TestHelper.fakePostModel({type: 'custom_am_whiteboard'}))).toBe(true);
        expect(isAmPluginPost(TestHelper.fakePostModel({type: 'custom_todo'}))).toBe(true);
        expect(isAmPluginPost(TestHelper.fakePostModel({type: ''}))).toBe(false);
    });

    it('should leave GIF posts with an invalid item to their message', () => {
        expect(isAmPluginPost(TestHelper.fakePostModel({type: 'custom_antimatter_gif', props: {}}))).toBe(false);
        expect(isAmPluginPost(TestHelper.fakePostModel({
            type: 'custom_antimatter_gif',
            props: {antimatter_gif: {id: '1', kind: 'gif', post: {url: '/plugins/com.antimatterchat.gifs/media/1.gif'}}},
        }))).toBe(true);
    });
});
