// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {BehaviorSubject} from 'rxjs';
import {map, distinctUntilChanged} from 'rxjs/operators';

import type {AssistantCard, AssistantFeedResponse} from '@assistant/types/assistant';

// In-memory state for the assistant's per-channel feed, per server: nothing here is
// persisted (same as the Calendar and Agents products' own stores). GET /feed fills it;
// the three websocket events (assistant_card_added, assistant_card_updated,
// assistant_offer_updated) patch it so the open screen stays current without re-fetching.

export type AssistantFeedState = {
    enabled: boolean;
    on: boolean;
    engine: AssistantFeedResponse['engine'];
    cards: AssistantCard[];
    loaded: boolean;
};

const EMPTY_FEED: AssistantFeedState = {
    enabled: true,
    on: true,
    engine: 'rules',
    cards: [],
    loaded: false,
};

function sortCards(cards: AssistantCard[]): AssistantCard[] {
    // Pinned cards first, then the newest, matching the feed's own order (ASSISTANT_API.md).
    return [...cards].sort((a, b) => {
        if (a.pinned !== b.pinned) {
            return a.pinned ? -1 : 1;
        }
        return b.create_at - a.create_at;
    });
}

class ServerSubjects<T> {
    private subjects = new Map<string, BehaviorSubject<T>>();

    constructor(private initial: () => T) {}

    get(serverUrl: string) {
        let subject = this.subjects.get(serverUrl);
        if (!subject) {
            subject = new BehaviorSubject<T>(this.initial());
            this.subjects.set(serverUrl, subject);
        }
        return subject;
    }

    clear(serverUrl: string) {
        this.subjects.get(serverUrl)?.next(this.initial());
    }
}

class AssistantStore {
    private feedByChannel = new ServerSubjects<Record<string, AssistantFeedState>>(() => ({}));
    private mutedTools = new ServerSubjects<string[]>(() => []);

    getFeed(serverUrl: string, channelId: string): AssistantFeedState {
        return this.feedByChannel.get(serverUrl).getValue()[channelId] ?? EMPTY_FEED;
    }

    observeFeed(serverUrl: string, channelId: string) {
        return this.feedByChannel.get(serverUrl).pipe(
            map((byChannel) => byChannel[channelId] ?? EMPTY_FEED),
            distinctUntilChanged(),
        );
    }

    setFeed(serverUrl: string, channelId: string, feed: AssistantFeedResponse) {
        const subject = this.feedByChannel.get(serverUrl);
        subject.next({
            ...subject.getValue(),
            [channelId]: {
                enabled: feed.enabled,
                on: feed.on,
                engine: feed.engine,
                cards: sortCards(feed.cards),
                loaded: true,
            },
        });
    }

    // upsertCard is used by both GET /feed's live updates (assistant_card_added) and by a
    // card's own action responses (dismiss, pin, mute, claim, run, post): the same shape
    // comes back from either, so one path keeps every open screen in sync.
    upsertCard(serverUrl: string, channelId: string, card: AssistantCard) {
        const subject = this.feedByChannel.get(serverUrl);
        const current = subject.getValue()[channelId] ?? EMPTY_FEED;
        const withoutCard = current.cards.filter((c) => c.id !== card.id);
        const cards = card.status === 'dismissed' ? withoutCard : sortCards([...withoutCard, card]);
        subject.next({
            ...subject.getValue(),
            [channelId]: {...current, cards},
        });
    }

    // patchOffer applies an assistant_offer_updated event to whichever card of the offer
    // this person holds (the event is per-recipient: `card_id` is always their own card).
    patchOffer(serverUrl: string, channelId: string, cardId: string, offer: AssistantCard['offer']) {
        const subject = this.feedByChannel.get(serverUrl);
        const current = subject.getValue()[channelId];
        if (!current) {
            return;
        }
        const cards = current.cards.map((c) => (c.id === cardId ? {...c, offer, offer_id: offer?.id ?? c.offer_id} : c));
        subject.next({
            ...subject.getValue(),
            [channelId]: {...current, cards},
        });
    }

    setChannelEnabled(serverUrl: string, channelId: string, on: boolean) {
        const subject = this.feedByChannel.get(serverUrl);
        const current = subject.getValue()[channelId] ?? EMPTY_FEED;
        subject.next({
            ...subject.getValue(),
            [channelId]: {...current, on},
        });
    }

    getMutedTools(serverUrl: string): string[] {
        return this.mutedTools.get(serverUrl).getValue();
    }

    observeMutedTools(serverUrl: string) {
        return this.mutedTools.get(serverUrl).asObservable();
    }

    setMutedTools(serverUrl: string, tools: string[]) {
        this.mutedTools.get(serverUrl).next(tools);
    }

    clear(serverUrl: string) {
        this.feedByChannel.clear(serverUrl);
        this.mutedTools.clear(serverUrl);
    }
}

export const assistantStore = new AssistantStore();
export {EMPTY_FEED};
