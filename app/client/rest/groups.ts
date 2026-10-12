// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {buildQueryString} from '@utils/helpers';

import {PER_PAGE_DEFAULT} from './constants';

import type ClientBase from './base';
import type {CommunityGroup} from '@utils/community_groups';

export interface ClientGroupsMix {
    getGroups: (params: {query?: string; filterAllowReference?: boolean; page?: number; perPage?: number; since?: number; includeMemberCount?: boolean}) => Promise<Group[]>;
    getAllGroupsAssociatedToChannel: (channelId: string, filterAllowReference?: boolean, groupLabel?: RequestGroupLabel) => Promise<{groups: Group[]; total_group_count: number}>;
    getAllGroupsAssociatedToMembership: (userId: string, filterAllowReference?: boolean, groupLabel?: RequestGroupLabel) => Promise<Group[]>;
    getAllGroupsAssociatedToTeam: (teamId: string, filterAllowReference?: boolean) => Promise<{groups: Group[]; total_group_count: number}>;
    getCommunityGroups: (page: number, perPage: number, groupLabel?: RequestGroupLabel) => Promise<CommunityGroup[]>;
}

const ClientGroups = <TBase extends Constructor<ClientBase>>(superclass: TBase) => class extends superclass {
    getGroups = async ({query = '', filterAllowReference = true, page = 0, perPage = PER_PAGE_DEFAULT, since = 0, includeMemberCount = false}) => {
        return this.doFetch(
            `${this.urlVersion}/groups${buildQueryString({
                q: query,
                filter_allow_reference: filterAllowReference,
                page,
                per_page: perPage,
                since,
                include_member_count: includeMemberCount,
            })}`,
            {method: 'get'},
        );
    };

    getAllGroupsAssociatedToChannel = async (channelId: string, filterAllowReference = false, groupLabel?: RequestGroupLabel) => {
        return this.doFetch(
            `${this.urlVersion}/channels/${channelId}/groups${buildQueryString({
                paginate: false,
                filter_allow_reference: filterAllowReference,
                include_member_count: true,
            })}`,
            {method: 'get', groupLabel},
        );
    };

    getAllGroupsAssociatedToTeam = async (teamId: string, filterAllowReference = false) => {
        return this.doFetch(
            `${this.urlVersion}/teams/${teamId}/groups${buildQueryString({paginate: false, filter_allow_reference: filterAllowReference})}`,
            {method: 'get'},
        );
    };

    getAllGroupsAssociatedToMembership = async (userId: string, filterAllowReference = false, groupLabel?: RequestGroupLabel) => {
        return this.doFetch(
            `${this.urlVersion}/users/${userId}/groups${buildQueryString({paginate: false, filter_allow_reference: filterAllowReference})}`,
            {method: 'get', groupLabel},
        );
    };

    // The custom groups of every community (Antimatter's teams and roles), with their members.
    getCommunityGroups = async (page: number, perPage: number, groupLabel?: RequestGroupLabel) => {
        return this.doFetch(
            `${this.urlVersion}/groups${buildQueryString({
                group_source: 'custom',
                include_member_ids: true,
                page,
                per_page: perPage,
            })}`,
            {method: 'get', groupLabel},
        );
    };
};

export default ClientGroups;
