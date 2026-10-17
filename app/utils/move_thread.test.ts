// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {General, Permissions, Post} from '@constants';

import {
    canMoveThread,
    canMoveThreadTo,
    filterMoveTargets,
    grants,
    isMovableThread,
    isThreadMine,
    isThreadModerator,
    splitRoles,
    type MoveThreadChannel,
    type MoveThreadTarget,
} from './move_thread';

// Antimatter's thread moving rules, as the server's App.CanMoveThread and Fusion's canMoveThreadTo.

const channel = (id: string, type: string = General.OPEN_CHANNEL, overwrite: Partial<MoveThreadChannel> = {}): MoveThreadChannel => ({
    id,
    teamId: 'team1',
    type,
    deleteAt: 0,
    ...overwrite,
});

const target = (c: MoveThreadChannel, overwrite: Partial<MoveThreadTarget> = {}): MoveThreadTarget => ({
    channel: c,
    isMember: true,
    canPost: true,
    ...overwrite,
});

const publicSource = channel('town', General.OPEN_CHANNEL);
const privateSource = channel('secret', General.PRIVATE_CHANNEL);
const myRoot = {type: '', rootId: '', userId: 'me'};
const theirRoot = {type: '', rootId: '', userId: 'them'};

const author = {userId: 'me', isModerator: false, threadIsMine: false};
const soleAuthor = {userId: 'me', isModerator: false, threadIsMine: true};
const moderator = {userId: 'me', isModerator: true, threadIsMine: false};

describe('isMovableThread', () => {
    it('should move a community channel\'s threads', () => {
        expect(isMovableThread(myRoot, publicSource)).toBe(true);
        expect(isMovableThread(myRoot, privateSource)).toBe(true);
    });

    it('should not move direct or group messages, archived channels, nor channels without a community', () => {
        expect(isMovableThread(myRoot, channel('dm', General.DM_CHANNEL, {teamId: ''}))).toBe(false);
        expect(isMovableThread(myRoot, channel('gm', General.GM_CHANNEL, {teamId: ''}))).toBe(false);
        expect(isMovableThread(myRoot, channel('old', General.OPEN_CHANNEL, {deleteAt: 1}))).toBe(false);
        expect(isMovableThread(myRoot, channel('odd', General.OPEN_CHANNEL, {teamId: ''}))).toBe(false);
        expect(isMovableThread(myRoot, undefined)).toBe(false);
    });

    it('should not move system or burn-on-read messages, nor take a reply for the first message', () => {
        expect(isMovableThread({...myRoot, type: Post.POST_TYPES.JOIN_CHANNEL}, publicSource)).toBe(false);
        expect(isMovableThread({...myRoot, type: Post.POST_TYPES.BURN_ON_READ}, publicSource)).toBe(false);
        expect(isMovableThread({...myRoot, rootId: 'root'}, publicSource)).toBe(false);
        expect(isMovableThread(undefined, publicSource)).toBe(false);
    });
});

describe('isThreadModerator', () => {
    const roles = [
        {name: 'system_admin', permissions: [Permissions.MANAGE_SYSTEM]},
        {name: 'system_user', permissions: [Permissions.CREATE_POST]},
        {name: 'team_admin', permissions: [Permissions.MANAGE_TEAM]},
        {name: 'team_user', permissions: []},
        {name: 'channel_user', permissions: [Permissions.CREATE_POST]},
        {name: 'channel_moderator', permissions: [Permissions.DELETE_OTHERS_POSTS]},
    ];
    const member = {user: ['system_user'], team: ['team_user'], channel: ['channel_user']};

    it('should know the channel\'s admins, the community\'s, system admins and who manages messages', () => {
        expect(isThreadModerator(roles, {...member, channel: ['channel_user', Permissions.CHANNEL_ADMIN_ROLE]})).toBe(true);
        expect(isThreadModerator(roles, {...member, team: ['team_user', 'team_admin']})).toBe(true);
        expect(isThreadModerator(roles, {...member, user: ['system_user', 'system_admin']})).toBe(true);
        expect(isThreadModerator(roles, {...member, channel: ['channel_user', 'channel_moderator']})).toBe(true);
    });

    it('should not take a member for a moderator', () => {
        expect(isThreadModerator(roles, member)).toBe(false);
    });

    it('should not take a channel role for system or community rights', () => {
        const odd = [{name: 'channel_odd', permissions: [Permissions.MANAGE_SYSTEM, Permissions.MANAGE_TEAM]}];
        expect(isThreadModerator(odd, {...member, channel: ['channel_odd']})).toBe(false);
    });
});

describe('canMoveThread', () => {
    it('should offer to move one\'s own threads, and moderators any', () => {
        expect(canMoveThread(myRoot, publicSource, 'me', false)).toBe(true);
        expect(canMoveThread(myRoot, privateSource, 'me', false)).toBe(true);
        expect(canMoveThread(theirRoot, publicSource, 'me', true)).toBe(true);
    });

    it('should not offer to move someone else\'s thread to a member', () => {
        expect(canMoveThread(theirRoot, publicSource, 'me', false)).toBe(false);
    });

    it('should not offer what can\'t move, even to moderators', () => {
        expect(canMoveThread(myRoot, channel('dm', General.DM_CHANNEL, {teamId: ''}), 'me', true)).toBe(false);
        expect(canMoveThread({...theirRoot, type: Post.POST_TYPES.JOIN_CHANNEL}, publicSource, 'me', true)).toBe(false);
    });
});

describe('canMoveThreadTo', () => {
    const publicTarget = channel('ops', General.OPEN_CHANNEL);
    const privateTarget = channel('board', General.PRIVATE_CHANNEL);

    it('should let the author move a thread others replied to between public channels', () => {
        expect(canMoveThreadTo(myRoot, publicSource, target(publicTarget), author)).toBe(true);
    });

    it('should refuse the author a private channel, either way, when others replied', () => {
        expect(canMoveThreadTo(myRoot, publicSource, target(privateTarget), author)).toBe(false);
        expect(canMoveThreadTo(myRoot, privateSource, target(publicTarget), author)).toBe(false);
        expect(canMoveThreadTo(myRoot, privateSource, target(privateTarget), author)).toBe(false);
    });

    it('should let the author move a thread that is all theirs anywhere', () => {
        expect(canMoveThreadTo(myRoot, publicSource, target(privateTarget), soleAuthor)).toBe(true);
        expect(canMoveThreadTo(myRoot, privateSource, target(publicTarget), soleAuthor)).toBe(true);
        expect(canMoveThreadTo(myRoot, privateSource, target(privateTarget), soleAuthor)).toBe(true);
    });

    it('should let moderators move any thread anywhere in the community', () => {
        expect(canMoveThreadTo(theirRoot, privateSource, target(publicTarget), moderator)).toBe(true);
        expect(canMoveThreadTo(theirRoot, publicSource, target(privateTarget), moderator)).toBe(true);
    });

    it('should refuse someone else\'s thread to a member, even between public channels', () => {
        expect(canMoveThreadTo(theirRoot, publicSource, target(publicTarget), author)).toBe(false);
        expect(canMoveThreadTo(theirRoot, publicSource, target(publicTarget), soleAuthor)).toBe(false);
    });

    it('should refuse targets one can\'t move to, even to moderators', () => {
        expect(canMoveThreadTo(myRoot, publicSource, target(publicSource), moderator)).toBe(false);
        expect(canMoveThreadTo(myRoot, publicSource, target(channel('elsewhere', General.OPEN_CHANNEL, {teamId: 'team2'})), moderator)).toBe(false);
        expect(canMoveThreadTo(myRoot, publicSource, target(channel('old', General.OPEN_CHANNEL, {deleteAt: 1})), moderator)).toBe(false);
        expect(canMoveThreadTo(myRoot, publicSource, target(channel('dm', General.DM_CHANNEL)), moderator)).toBe(false);
        expect(canMoveThreadTo(myRoot, publicSource, target(publicTarget, {isMember: false}), moderator)).toBe(false);
        expect(canMoveThreadTo(myRoot, publicSource, target(publicTarget, {canPost: false}), moderator)).toBe(false);
    });
});

describe('filterMoveTargets', () => {
    const targets = [
        target(publicSource),
        target(channel('ops', General.OPEN_CHANNEL)),
        target(channel('board', General.PRIVATE_CHANNEL)),
        target(channel('readonly', General.OPEN_CHANNEL), {canPost: false}),
        target(channel('old', General.OPEN_CHANNEL, {deleteAt: 1})),
        target(channel('other-team', General.OPEN_CHANNEL, {teamId: 'team2'})),
    ];
    const ids = (channels: MoveThreadChannel[]) => channels.map((c) => c.id);

    it('should list only public channels to an author moving others\' replies', () => {
        expect(ids(filterMoveTargets(myRoot, publicSource, targets, author))).toEqual(['ops']);
    });

    it('should list nothing to an author moving others\' replies out of a private channel', () => {
        expect(filterMoveTargets(myRoot, privateSource, targets, author)).toEqual([]);
    });

    it('should list public and private channels to a sole author or a moderator', () => {
        expect(ids(filterMoveTargets(myRoot, publicSource, targets, soleAuthor))).toEqual(['ops', 'board']);
        expect(ids(filterMoveTargets(theirRoot, publicSource, targets, moderator))).toEqual(['ops', 'board']);
    });

    it('should list nothing to whoever may not move the thread', () => {
        expect(filterMoveTargets(theirRoot, publicSource, targets, author)).toEqual([]);
    });
});

describe('isThreadMine', () => {
    it('should check every message of the thread', () => {
        expect(isThreadMine('me', [{user_id: 'me'}, {user_id: 'me'}])).toBe(true);
        expect(isThreadMine('me', [{user_id: 'me'}, {user_id: 'them'}])).toBe(false);
        expect(isThreadMine('me', [{userId: 'me'}])).toBe(true);
        expect(isThreadMine('me', [])).toBe(false);
    });
});

describe('grants and splitRoles', () => {
    it('should only count the roles held', () => {
        const roles = [{name: 'a', permissions: ['p']}, {name: 'b', permissions: ['q']}];
        expect(grants(roles, ['a'], 'p')).toBe(true);
        expect(grants(roles, ['a'], 'q')).toBe(false);
        expect(grants(roles, [], 'p')).toBe(false);
        expect(splitRoles('channel_user  channel_admin')).toEqual(['channel_user', 'channel_admin']);
        expect(splitRoles(undefined)).toEqual([]);
    });
});
