// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useEffect, useState} from 'react';

import DatabaseManager from '@database/manager';
import {getUserById} from '@queries/servers/user';

import type {AssistantCard} from '@assistant/types/assistant';

type HolderEntry = readonly [id: string, username: string | undefined];

// resolveHolderNames looks up each distinct holder id from the already-synced local user
// cache. A failure (the server not initialised yet, an id with no cached user) resolves to
// undefined/no username rather than throwing, so the UI can always fall back to the raw id.
async function resolveHolderNames(serverUrl: string, holderIds: string[]): Promise<HolderEntry[] | undefined> {
    try {
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        return await Promise.all(holderIds.map((id) => resolveHolderName(database, id)));
    } catch {
        return undefined;
    }
}

async function resolveHolderName(database: Parameters<typeof getUserById>[0], id: string): Promise<HolderEntry> {
    const user = await getUserById(database, id);
    return [id, user?.username];
}

function mergeNames(current: Record<string, string>, entries: HolderEntry[]): Record<string, string> {
    const next = {...current};
    for (const [id, username] of entries) {
        if (username) {
            next[id] = username;
        }
    }
    return next;
}

// useOfferHolderNames resolves "Offered to <name>" for action cards: a card only carries
// the holder's id (ASSISTANT_API.md), so this looks up each distinct holder once from the
// already-synced local user cache and keeps a {id: username} map for the cards on screen.
export function useOfferHolderNames(serverUrl: string, cards: AssistantCard[]) {
    const [names, setNames] = useState<Record<string, string>>({});

    useEffect(() => {
        const holderIds = Array.from(new Set(
            cards.
                filter((card) => card.kind === 'action' && card.offer?.holder_id && !card.offer.can_run).
                map((card) => card.offer!.holder_id),
        )).filter((id) => !names[id]);

        if (holderIds.length === 0) {
            return undefined;
        }

        let cancelled = false;
        resolveHolderNames(serverUrl, holderIds).then((resolved) => {
            if (!cancelled && resolved) {
                setNames(mergeNames(names, resolved));
            }
        });

        return () => {
            cancelled = true;
        };

        // `names` is read above only to filter out ids already resolved; including it in
        // the deps would re-run this effect every time it's updated by itself.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverUrl, cards]);

    return names;
}
