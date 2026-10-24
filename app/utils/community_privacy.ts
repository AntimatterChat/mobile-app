// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Antimatter: a member's own privacy choices for direct messages and profile details, kept as the profile_privacy
// user prop (own choices only: the server works out what a community's members actually see, the most restrictive
// of every community they share with the viewer). Mirrors the web app's privacy/profile_privacy.ts.

export const PROFILE_PRIVACY_PROP = 'profile_privacy';
export const PROFILE_DEFAULT = 'default';

// PROFILE_FIELDS is every detail that can be hidden, in the order the server and the web app show them in.
export const PROFILE_FIELDS = ['full_name', 'nickname', 'position', 'email', 'local_time', 'attributes'] as const;
export type ProfileField = typeof PROFILE_FIELDS[number];

export type ProfilePrivacy = Partial<Record<string, ProfileField[]>>;

// parseProfilePrivacy reads the profile_privacy prop, ignoring anything broken (it never blocks showing a profile).
export function parseProfilePrivacy(props: UserProps | null | undefined): ProfilePrivacy {
    const value = props?.[PROFILE_PRIVACY_PROP];
    if (!value || typeof value !== 'string') {
        return {};
    }
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

// hiddenIn is which details are hidden for one community (or the default, with scope === PROFILE_DEFAULT): the
// community's own choice, else the default, else none.
export function hiddenIn(privacy: ProfilePrivacy, scope: string): ProfileField[] {
    return privacy[scope] ?? privacy[PROFILE_DEFAULT] ?? [];
}

// withHiddenFields sets one scope's hidden fields, ready to save back as the prop's value. null clears the scope's
// own choice (falling back to the default); an empty array is a deliberate choice to hide nothing there.
export function withHiddenFields(privacy: ProfilePrivacy, scope: string, fields: ProfileField[] | null): ProfilePrivacy {
    const next = {...privacy};
    if (fields === null) {
        delete next[scope];
    } else {
        next[scope] = fields;
    }
    return next;
}
