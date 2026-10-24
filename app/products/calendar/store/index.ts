// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {BehaviorSubject} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';

import type {NextMeeting} from '../types/calendar';

// In-memory state for the Calendar app's scheduled calls (F292), per server: the channel
// header chip's own read (keyed by channel) and the "a call changed" signal from the
// meeting_changed websocket event. Nothing here is kept in the database: it's re-read
// from the server (GET /channels/{id}/meetings/next, GET /meetings/{id}, GET /meetings)
// whenever a component needs it, same as the Calls and Antimatter-plugins products do.

export type MeetingChangedSignal = {
    id: string;
    channelId: string;
    at: number;
};

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

class CalendarStore {
    private nextByChannel = new ServerSubjects<Record<string, NextMeeting | null | undefined>>(() => ({}));
    private changed = new ServerSubjects<MeetingChangedSignal | undefined>(() => undefined);

    // The channel header chip's own read: undefined (not read yet), null (no next call).
    getNextMeeting(serverUrl: string, channelId: string): NextMeeting | null | undefined {
        return this.nextByChannel.get(serverUrl).getValue()[channelId];
    }

    setNextMeeting(serverUrl: string, channelId: string, next: NextMeeting | null) {
        const subject = this.nextByChannel.get(serverUrl);
        subject.next({...subject.getValue(), [channelId]: next});
    }

    observeNextMeeting(serverUrl: string, channelId: string) {
        return this.nextByChannel.get(serverUrl).pipe(
            map((byChannel) => byChannel[channelId]),
            distinctUntilChanged(),
        );
    }

    // emitChanged signals that a call changed (scheduled, edited, cancelled, answered, or its
    // reminder changed), from the meeting_changed websocket event. Components that show that
    // call, that channel's chip, or the community's calls read the server again.
    emitChanged(serverUrl: string, id: string, channelId: string) {
        this.changed.get(serverUrl).next({id, channelId, at: Date.now()});
    }

    observeChanged(serverUrl: string) {
        return this.changed.get(serverUrl).asObservable();
    }

    clear(serverUrl: string) {
        this.nextByChannel.clear(serverUrl);
        this.changed.clear(serverUrl);
    }
}

export const calendarStore = new CalendarStore();
