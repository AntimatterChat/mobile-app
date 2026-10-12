// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {isSpoilerPost, isSpoilerShown, setSpoilerShown, subscribeToSpoilers} from './spoiler';

describe('spoilers', () => {
    it('should tell spoilers by their spoiler prop, as a boolean or a string', () => {
        expect(isSpoilerPost({props: {spoiler: true}})).toBe(true);
        expect(isSpoilerPost({props: {spoiler: 'true'}})).toBe(true);
        expect(isSpoilerPost({props: {spoiler: false}})).toBe(false);
        expect(isSpoilerPost({props: null})).toBe(false);
        expect(isSpoilerPost(undefined)).toBe(false);
    });

    it('should remember the spoilers shown and tell their listeners when it changes', () => {
        const listener = jest.fn();
        const unsubscribe = subscribeToSpoilers(listener);

        expect(isSpoilerShown('post1')).toBe(false);
        setSpoilerShown('post1', true);
        expect(isSpoilerShown('post1')).toBe(true);
        expect(listener).toHaveBeenCalledTimes(1);

        // Showing it again changes nothing.
        setSpoilerShown('post1', true);
        expect(listener).toHaveBeenCalledTimes(1);

        setSpoilerShown('post1', false);
        expect(isSpoilerShown('post1')).toBe(false);
        expect(listener).toHaveBeenCalledTimes(2);

        unsubscribe();
        setSpoilerShown('post1', true);
        expect(listener).toHaveBeenCalledTimes(2);
        setSpoilerShown('post1', false);
    });
});
