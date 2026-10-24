// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {isCommunityNotifyEmpty, parseCommunityNotifyProps, withCommunityNotifyProp} from './community_notify';

describe('parseCommunityNotifyProps', () => {
    it('should parse a stored overrides object', () => {
        expect(parseCommunityNotifyProps(JSON.stringify({desktop: 'mention', email: 'false'}))).toEqual({desktop: 'mention', email: 'false'});
    });

    it('should return nothing for a missing or broken value', () => {
        expect(parseCommunityNotifyProps(null)).toEqual({});
        expect(parseCommunityNotifyProps(undefined)).toEqual({});
        expect(parseCommunityNotifyProps('')).toEqual({});
        expect(parseCommunityNotifyProps('{oops')).toEqual({});
        expect(parseCommunityNotifyProps('[1,2]')).toEqual({});
    });
});

describe('withCommunityNotifyProp', () => {
    it('should set a key when given a value', () => {
        expect(withCommunityNotifyProp({}, 'desktop', 'mention')).toEqual({desktop: 'mention'});
    });

    it('should remove a key when given an empty value (follow my own settings)', () => {
        const props = {desktop: 'mention', email: 'false'};
        expect(withCommunityNotifyProp(props, 'desktop', '')).toEqual({email: 'false'});
    });

    it('should not touch the other keys', () => {
        const props = {desktop: 'mention', email: 'false'};
        expect(withCommunityNotifyProp(props, 'push', 'all')).toEqual({desktop: 'mention', email: 'false', push: 'all'});
    });
});

describe('isCommunityNotifyEmpty', () => {
    it('should be true only once every key has been cleared', () => {
        expect(isCommunityNotifyEmpty({})).toBe(true);
        expect(isCommunityNotifyEmpty({desktop: 'mention'})).toBe(false);
    });
});
