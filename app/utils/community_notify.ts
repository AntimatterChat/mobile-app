// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Antimatter: a member's own notification overrides for one community, kept as the community_notify preference
// (category community_notify, name = the community/team id), layered on top of their own notification settings.
// Mirrors the web app's modals/community_notify.ts.

export const COMMUNITY_NOTIFY_CATEGORY = 'community_notify';

// CommunityNotifyKeys is every notify-prop key a community override may set. An empty string means "follow my own
// settings" and is never stored (see withCommunityNotifyProp).
export const COMMUNITY_NOTIFY_KEYS = [
    'desktop',
    'desktop_threads',
    'desktop_sound',
    'desktop_notification_sound',
    'push',
    'push_threads',
    'email',
    'channel',
] as const;
export type CommunityNotifyKey = typeof COMMUNITY_NOTIFY_KEYS[number];

export type CommunityNotifyProps = Partial<Record<CommunityNotifyKey, string>>;

// parseCommunityNotifyProps reads a community_notify preference's value, ignoring anything broken.
export function parseCommunityNotifyProps(value: string | null | undefined): CommunityNotifyProps {
    if (!value) {
        return {};
    }
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

// withCommunityNotifyProp merges one key into a community's overrides: an empty value removes that key (follow my
// own settings for it again). The caller deletes the whole preference once nothing is left overridden (see
// isCommunityNotifyEmpty).
export function withCommunityNotifyProp(props: CommunityNotifyProps, key: CommunityNotifyKey, value: string): CommunityNotifyProps {
    const next = {...props};
    if (value) {
        next[key] = value;
    } else {
        delete next[key];
    }
    return next;
}

export function isCommunityNotifyEmpty(props: CommunityNotifyProps): boolean {
    return Object.keys(props).length === 0;
}
