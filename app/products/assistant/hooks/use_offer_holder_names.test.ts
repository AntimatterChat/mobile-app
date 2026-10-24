// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, renderHook} from '@testing-library/react-native';

import DatabaseManager from '@database/manager';
import {getUserById} from '@queries/servers/user';

import {useOfferHolderNames} from './use_offer_holder_names';

import type {AssistantCard} from '@assistant/types/assistant';

jest.mock('@queries/servers/user');
jest.mock('@database/manager', () => ({
    __esModule: true,
    default: {
        getServerDatabaseAndOperator: jest.fn(() => ({database: {}})),
    },
}));

const SERVER_URL = 'https://test.mattermost.com';

function makeAction(holderId: string, canRun = false): AssistantCard {
    return {
        id: `action-${holderId}`,
        user_id: 'me',
        channel_id: 'channel1',
        kind: 'action',
        tool: 'mcp.ci.deploy',
        tool_title: 'Deploy',
        arguments: {},
        why: {engine: 'model'},
        post_ids: [],
        dedupe_key: 'd',
        status: 'new',
        pinned: false,
        offer: {id: 'offer1', status: 'open', holder_id: holderId, offered_to_me: false, can_run: canRun, moves_at: 0},
        create_at: 1,
        update_at: 1,
    };
}

describe('useOfferHolderNames', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('resolves the username for each distinct holder offered to someone else', async () => {
        jest.mocked(getUserById).mockResolvedValue({username: 'priya'} as any);

        const {result} = renderHook(() => useOfferHolderNames(SERVER_URL, [makeAction('user2')]));

        await act(async () => {
            await Promise.resolve();
        });

        expect(getUserById).toHaveBeenCalledWith({}, 'user2');
        expect(result.current.user2).toBe('priya');
    });

    it('does not look up a holder who can run (it is the viewer themself)', async () => {
        renderHook(() => useOfferHolderNames(SERVER_URL, [makeAction('me', true)]));
        await act(async () => {
            await Promise.resolve();
        });
        expect(getUserById).not.toHaveBeenCalled();
    });

    it('does not crash when the database is not ready', async () => {
        jest.mocked(DatabaseManager.getServerDatabaseAndOperator).mockImplementation(() => {
            throw new Error('no database');
        });

        const {result} = renderHook(() => useOfferHolderNames(SERVER_URL, [makeAction('user3')]));
        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current).toEqual({});
    });
});
