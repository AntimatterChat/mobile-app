// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useEffect, useState} from 'react';

import DatabaseManager from '@database/manager';
import {getUserById} from '@queries/servers/user';

import type {AssistantCard} from '@assistant/types/assistant';

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
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
                const entries = await Promise.all(holderIds.map(async (id) => {
                    const user = await getUserById(database, id);
                    return [id, user?.username] as const;
                }));
                if (cancelled) {
                    return;
                }
                setNames((prev) => {
                    const next = {...prev};
                    for (const [id, username] of entries) {
                        if (username) {
                            next[id] = username;
                        }
                    }
                    return next;
                });
            } catch {
                // The server might not be initialised in tests or edge cases; the UI
                // falls back to the raw holder id when a name can't be resolved.
            }
        })();

        return () => {
            cancelled = true;
        };

        // `names` is read above only to filter out ids already resolved; including it in
        // the deps would re-run this effect every time it's updated by itself.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverUrl, cards]);

    return names;
}
