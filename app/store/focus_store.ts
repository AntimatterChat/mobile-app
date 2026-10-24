// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {BehaviorSubject} from 'rxjs';

// FocusStore holds the focus whose summary waits to be shown in this app, across the websocket handler (focus_ended)
// and the check made on launch or reconnect (the focus may have ended while the app was away). Per server: the key
// is the server url, since someone may focus on one server and not another.
class FocusStoreSingleton {
    private subjects: {[serverUrl: string]: BehaviorSubject<FocusWindow | null>} = {};

    private subject(serverUrl: string) {
        if (!this.subjects[serverUrl]) {
            this.subjects[serverUrl] = new BehaviorSubject<FocusWindow | null>(null);
        }
        return this.subjects[serverUrl];
    }

    setFocusSummaryWindow = (serverUrl: string, window: FocusWindow | null) => {
        const current = this.subject(serverUrl).value;
        if (current?.start_at === window?.start_at && current?.end_at === window?.end_at) {
            return;
        }
        this.subject(serverUrl).next(window);
    };

    observe = (serverUrl: string) => {
        return this.subject(serverUrl).asObservable();
    };

    getState = (serverUrl: string) => {
        return this.subject(serverUrl).value;
    };
}

const FocusStore = new FocusStoreSingleton();
export default FocusStore;
