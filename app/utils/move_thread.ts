// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {General, Permissions, Post as PostConstants} from '@constants';

// The rules of Antimatter's thread moving, as the server applies them (POST /posts/{post_id}/move_to_channel,
// App.CanMoveThread) and Fusion shows them (fusion/rhs/thread_to.tsx):
// - a thread moves from a channel of a community (not a direct or group message) that isn't archived, to another
//   channel of the same community that isn't archived, where one is a member and may post; system and
//   burn-on-read messages don't move;
// - moderators move any thread of the channel: its channel admins, the community's admins, whoever may delete
//   others' messages there ("Manage messages"), and system admins;
// - the thread's author without those rights moves it only when every message of the thread is theirs, or when both
//   channels are public: they mustn't expose others' replies from a private channel, nor hide them in a private one.

export type MoveThreadChannel = {
    id: string;
    teamId: string;
    type: string;
    deleteAt: number;
};

export type MoveThreadRoot = {
    type?: string;
    rootId?: string;
    userId: string;
};

export type RoleLike = {
    name: string;
    permissions: string[];
};

// The roles one holds where the thread is: in the system, the community and the source channel.
export type MoveThreadRoleNames = {
    user: string[];
    team: string[];
    channel: string[];
};

const isCommunityChannel = (channel?: MoveThreadChannel): channel is MoveThreadChannel => Boolean(
    channel?.teamId &&
    channel.deleteAt === 0 &&
    (channel.type === General.OPEN_CHANNEL || channel.type === General.PRIVATE_CHANNEL),
);

// grants says whether roles named names give permission.
export function grants(roles: RoleLike[], names: string[], permission: string): boolean {
    const held = new Set(names.filter(Boolean));
    return roles.some((role) => held.has(role.name) && role.permissions.includes(permission));
}

// splitRoles turns a roles field ("channel_user channel_admin") into role names.
export const splitRoles = (roles?: string | null) => (roles ? roles.split(' ').filter(Boolean) : []);

// isMovableThread says whether the thread of root can move at all from source.
export function isMovableThread(root: MoveThreadRoot | undefined, source: MoveThreadChannel | undefined): boolean {
    if (!root || root.rootId || !isCommunityChannel(source)) {
        return false;
    }
    if (root.type?.startsWith(PostConstants.POST_TYPES.SYSTEM_MESSAGE_PREFIX) || root.type === PostConstants.POST_TYPES.BURN_ON_READ) {
        return false;
    }
    return true;
}

// isThreadModerator says whether one moderates the threads of the source channel, given one's roles there.
export function isThreadModerator(roles: RoleLike[], names: MoveThreadRoleNames): boolean {
    if (names.channel.includes(Permissions.CHANNEL_ADMIN_ROLE)) {
        return true;
    }
    const everywhere = [...names.user, ...names.team, ...names.channel];
    return grants(roles, names.user, Permissions.MANAGE_SYSTEM) ||
        grants(roles, [...names.user, ...names.team], Permissions.MANAGE_TEAM) ||
        grants(roles, everywhere, Permissions.DELETE_OTHERS_POSTS);
}

// canMoveThread says whether one may move the thread somewhere, which shows "Move thread…": its author, and
// moderators.
export function canMoveThread(root: MoveThreadRoot | undefined, source: MoveThreadChannel | undefined, userId: string, isModerator: boolean): boolean {
    if (!root || !isMovableThread(root, source)) {
        return false;
    }
    return root.userId === userId || isModerator;
}

// isThreadMine says whether every message of a thread (its first message and its replies, all of them) is userId's.
export function isThreadMine(userId: string, posts: Array<{user_id?: string; userId?: string}>): boolean {
    return posts.length > 0 && posts.every((p) => (p.user_id ?? p.userId) === userId);
}

export type MoveThreadRule = {
    userId: string;
    isModerator: boolean;

    // Whether every message of the thread is the user's, once the thread is loaded.
    threadIsMine: boolean;
};

export type MoveThreadTarget<C extends MoveThreadChannel = MoveThreadChannel> = {
    channel: C;

    // Whether one is a member of the channel and may post in it (create_post).
    isMember: boolean;
    canPost: boolean;
};

// canMoveThreadTo says whether one may move the thread of root from source to target.
export function canMoveThreadTo(root: MoveThreadRoot | undefined, source: MoveThreadChannel | undefined, target: MoveThreadTarget, rule: MoveThreadRule): boolean {
    if (!root || !source || !isMovableThread(root, source) || !isCommunityChannel(target.channel)) {
        return false;
    }
    if (target.channel.id === source.id || target.channel.teamId !== source.teamId || !target.isMember || !target.canPost) {
        return false;
    }
    if (rule.isModerator) {
        return true;
    }
    if (root.userId !== rule.userId) {
        return false;
    }
    return (source.type === General.OPEN_CHANNEL && target.channel.type === General.OPEN_CHANNEL) || rule.threadIsMine;
}

// filterMoveTargets keeps the channels the thread may move to.
export function filterMoveTargets<C extends MoveThreadChannel>(root: MoveThreadRoot | undefined, source: MoveThreadChannel | undefined, targets: Array<MoveThreadTarget<C>>, rule: MoveThreadRule): C[] {
    return targets.filter((t) => canMoveThreadTo(root, source, t, rule)).map((t) => t.channel);
}
