// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type ClientBase from './base';

export interface ClientCommunityRulesMix {
    getCommunityRulesRoute: (teamId: string) => string;
    getCommunityRules: (teamId: string) => Promise<CommunityRules>;
    acceptCommunityRules: (teamId: string, version: number) => Promise<CommunityRules>;
}

const ClientCommunityRules = <TBase extends Constructor<ClientBase>>(superclass: TBase) => class extends superclass {
    getCommunityRulesRoute = (teamId: string) => {
        return `${this.getTeamRoute(teamId)}/rules`;
    };

    getCommunityRules = async (teamId: string) => {
        return this.doFetch(
            this.getCommunityRulesRoute(teamId),
            {method: 'get'},
        );
    };

    acceptCommunityRules = async (teamId: string, version: number) => {
        return this.doFetch(
            `${this.getCommunityRulesRoute(teamId)}/accept`,
            {method: 'post', body: {version}},
        );
    };
};

export default ClientCommunityRules;
