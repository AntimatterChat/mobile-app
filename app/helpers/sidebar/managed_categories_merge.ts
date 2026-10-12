// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {MANAGED_CHANNEL_CATEGORIES_FIELD, MANAGED_CHANNEL_CATEGORIES_GROUP, MANAGED_LOCAL_CATEGORY_PREFIX} from '@constants/categories';
import NetworkManager from '@managers/network_manager';
import {queryCategoriesByTeamIds} from '@queries/servers/categories';
import EphemeralStore from '@store/ephemeral_store';
import {findServerCategory, type ServerCategory} from '@store/server_categories_store';
import {logDebug} from '@utils/log';

import type {Database} from '@nozbe/watermelondb';

export function makeManagedCategoryId(teamId: string, displayName: string): string {
    return `${MANAGED_LOCAL_CATEGORY_PREFIX}${teamId}:${displayName}`;
}

export function computeManagedSortOrder(index: number): number {
    return (-1000 + index) * 10;
}

// How a community lays out its server categories (Antimatter), when the server says: the categories its admins set
// up, in order, and the ones its person folded.
export type ManagedLayout = {
    serverCategories?: ServerCategory[];
    collapsed?: string[];
};

const byNumericName = (a: string, b: string) => a.localeCompare(b, undefined, {numeric: true});

// managedCategoryNames orders a community's managed categories: those its admins set up, in their order, then the
// ones channels are filed under that the list lacks, by name. Without a list, they're all by name.
export function managedCategoryNames(serverCategories: ServerCategory[] | undefined, filedNames: Iterable<string>): string[] {
    const listed = [...(serverCategories ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((c) => c.name);
    const extra = [...new Set(filedNames)].filter((name) => !findServerCategory(serverCategories, name)).sort(byNumericName);
    return [...listed, ...extra];
}

// mergeManagedMappingsIntoSidebarCategories puts the managed categories above the person's own, with the channels
// filed in them. With the server's list of categories (Antimatter), they follow its order, its empty categories show
// too, and a channel of an open category that its person moved into one of their custom categories or their
// favourites stays there; a locked category keeps its channels.
export async function mergeManagedMappingsIntoSidebarCategories(
    database: Database,
    teamId: string,
    serverCategories: CategoryWithChannels[],
    mappings: Record<string, string>,
    layout: ManagedLayout = {},
): Promise<CategoryWithChannels[]> {
    const listed = layout.serverCategories;
    if (Object.keys(mappings).length === 0 && !listed?.length) {
        return serverCategories;
    }

    const kept = new Set<string>();
    if (listed) {
        for (const category of serverCategories) {
            if (category.type === 'custom' || category.type === 'favorites') {
                category.channel_ids.forEach((id) => kept.add(id));
            }
        }
    }

    const byName = new Map<string, string[]>();
    for (const [chId, rawName] of Object.entries(mappings)) {
        if (!rawName) {
            continue;
        }
        const known = findServerCategory(listed, rawName);
        if (listed && !known?.locked && kept.has(chId)) {
            continue;
        }
        const name = known?.name ?? rawName;
        const list = byName.get(name) ?? [];
        list.push(chId);
        byName.set(name, list);
    }

    const names = managedCategoryNames(listed, byName.keys());

    const allLocalCategories = await queryCategoriesByTeamIds(database, [teamId]).fetch();
    const collapsedById = new Map<string, boolean>();
    for (const cat of allLocalCategories) {
        collapsedById.set(cat.id, cat.collapsed);
    }

    const managedCategories = names.map((name, i) => {
        const channelIds = [...(byName.get(name) ?? [])].sort(byNumericName);
        const id = makeManagedCategoryId(teamId, name);
        return {
            id,
            team_id: teamId,
            display_name: name,
            sort_order: computeManagedSortOrder(i),
            sorting: 'alpha' as CategorySorting,
            type: 'custom' as CategoryType,
            muted: false,
            collapsed: layout.collapsed ? layout.collapsed.includes(name) : (collapsedById.get(id) ?? false),
            channel_ids: channelIds,
        };
    });

    return [...managedCategories, ...serverCategories];
}

export async function fetchManagedCategoryPropertyIds(serverUrl: string) {
    const cached = EphemeralStore.getManagedCategoryPropertyIds(serverUrl);
    if (cached) {
        return cached;
    }

    try {
        const client = NetworkManager.getClient(serverUrl);
        const fields = await client.getPropertyFields(MANAGED_CHANNEL_CATEGORIES_GROUP, 'channel', 'system');
        if (fields.length === 0) {
            return undefined;
        }

        const field = fields.find((f) => f.name === MANAGED_CHANNEL_CATEGORIES_FIELD);
        if (!field) {
            return undefined;
        }

        const managedCategoryPropertyIds = {groupId: field.group_id, fieldId: field.id};
        EphemeralStore.setManagedCategoryPropertyIds(serverUrl, managedCategoryPropertyIds);
        return managedCategoryPropertyIds;
    } catch (error) {
        logDebug('[fetchManagedCategoryPropertyIds]', error);
        return undefined;
    }
}
