// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PROFILE_DEFAULT, hiddenIn, parseProfilePrivacy, withHiddenFields, type ProfilePrivacy} from './community_privacy';

describe('parseProfilePrivacy', () => {
    it('should parse the stored map of scope to hidden fields', () => {
        const props = {profile_privacy: JSON.stringify({default: ['email'], team1: ['email', 'position']})};
        expect(parseProfilePrivacy(props)).toEqual({default: ['email'], team1: ['email', 'position']});
    });

    it('should ignore a missing or broken prop', () => {
        expect(parseProfilePrivacy(null)).toEqual({});
        expect(parseProfilePrivacy({})).toEqual({});
        expect(parseProfilePrivacy({profile_privacy: '{oops'})).toEqual({});
        expect(parseProfilePrivacy({profile_privacy: '[1,2]'})).toEqual({});
    });
});

describe('hiddenIn', () => {
    it("should use a community's own choice when it has one", () => {
        const privacy: ProfilePrivacy = {default: ['email'], team1: ['position']};
        expect(hiddenIn(privacy, 'team1')).toEqual(['position']);
    });

    it('should fall back to the default when the community has no choice of its own', () => {
        const privacy: ProfilePrivacy = {default: ['email']};
        expect(hiddenIn(privacy, 'team1')).toEqual(['email']);
    });

    it('should hide nothing when there is no default either', () => {
        expect(hiddenIn({}, 'team1')).toEqual([]);
    });
});

describe('withHiddenFields', () => {
    it("should set a community's own choice", () => {
        const next = withHiddenFields({}, 'team1', ['email']);
        expect(next).toEqual({team1: ['email']});
    });

    it("should clear a community's own choice, falling back to the default", () => {
        const privacy: ProfilePrivacy = {[PROFILE_DEFAULT]: ['email'], team1: ['position']};
        const next = withHiddenFields(privacy, 'team1', null);
        expect(next).toEqual({[PROFILE_DEFAULT]: ['email']});
        expect(hiddenIn(next, 'team1')).toEqual(['email']);
    });

    it('should keep a deliberate choice to hide nothing, distinct from clearing it', () => {
        const privacy: ProfilePrivacy = {[PROFILE_DEFAULT]: ['email']};
        const next = withHiddenFields(privacy, 'team1', []);
        expect(next.team1).toEqual([]);
        expect(hiddenIn(next, 'team1')).toEqual([]);
    });
});
