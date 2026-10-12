// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {BehaviorSubject} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';

// A server category (Antimatter) is a category an admin sets up for everyone in a community, above everyone's own,
// in the order the server gives. A locked one keeps its channels: people can't move them out to their own categories.
export type ServerCategory = {
    name: string;
    sort_order: number;
    locked: boolean;
};

const subjects: Record<string, BehaviorSubject<Record<string, ServerCategory[]>>> = {};

function getSubject(serverUrl: string) {
    if (!subjects[serverUrl]) {
        subjects[serverUrl] = new BehaviorSubject({});
    }
    return subjects[serverUrl];
}

export function getServerCategories(serverUrl: string, teamId: string): ServerCategory[] | undefined {
    return getSubject(serverUrl).value[teamId];
}

export function setServerCategories(serverUrl: string, teamId: string, categories: ServerCategory[]) {
    const subject = getSubject(serverUrl);
    subject.next({...subject.value, [teamId]: categories});
}

// findServerCategory finds a server category by name, ignoring case, as the server does.
export function findServerCategory(categories: ServerCategory[] | undefined, name: string) {
    const key = name.trim().toLowerCase();
    return categories?.find((c) => c.name.toLowerCase() === key);
}

// observeServerCategoryLocked tells whether a community's server category keeps its channels. While the list isn't
// known, it does: channels stay where the admins filed them.
export function observeServerCategoryLocked(serverUrl: string, teamId: string, name: string) {
    return getSubject(serverUrl).pipe(
        map((byTeam) => {
            const list = byTeam[teamId];
            return list ? Boolean(findServerCategory(list, name)?.locked) : true;
        }),
        distinctUntilChanged(),
    );
}
