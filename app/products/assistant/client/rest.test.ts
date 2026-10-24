// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import clientAssistant from './rest';

describe('ClientAssistant', () => {
    const mockDoFetch = jest.fn();

    const BaseClass = class {
        urlVersion = '/api/v4';
        doFetch = mockDoFetch;
    };
    const Client = clientAssistant(BaseClass);
    const client = new Client();

    const ROUTE = '/api/v4/assistant';
    const channelId = 'channel1';
    const cardId = 'card1';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getAssistantFeed', async () => {
        await client.getAssistantFeed(channelId);
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/channels/${channelId}/feed`, {method: 'get'});
    });

    it('setAssistantPresence open', async () => {
        await client.setAssistantPresence(channelId, true);
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/channels/${channelId}/presence`, {method: 'post', body: {open: true}});
    });

    it('setAssistantPresence closed', async () => {
        await client.setAssistantPresence(channelId, false);
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/channels/${channelId}/presence`, {method: 'post', body: {open: false}});
    });

    it('setAssistantChannelEnabled', async () => {
        await client.setAssistantChannelEnabled(channelId, false);
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/channels/${channelId}/enabled`, {method: 'put', body: {on: false}});
    });

    it('dismissAssistantCard', async () => {
        await client.dismissAssistantCard(channelId, cardId);
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/channels/${channelId}/cards/${cardId}/dismiss`, {method: 'post'});
    });

    it('pinAssistantCard', async () => {
        await client.pinAssistantCard(channelId, cardId, true);
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/channels/${channelId}/cards/${cardId}/pin`, {method: 'post', body: {pinned: true}});
    });

    it('muteAssistantCard', async () => {
        await client.muteAssistantCard(channelId, cardId);
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/channels/${channelId}/cards/${cardId}/mute`, {method: 'post'});
    });

    it('claimAssistantOffer', async () => {
        await client.claimAssistantOffer(channelId, cardId);
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/channels/${channelId}/cards/${cardId}/claim`, {method: 'post'});
    });

    it('runAssistantOffer', async () => {
        await client.runAssistantOffer(channelId, cardId);
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/channels/${channelId}/cards/${cardId}/run`, {method: 'post'});
    });

    it('postAssistantCard', async () => {
        await client.postAssistantCard(channelId, cardId);
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/channels/${channelId}/cards/${cardId}/post`, {method: 'post'});
    });

    it('getMutedAssistantTools', async () => {
        await client.getMutedAssistantTools();
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/muted_tools`, {method: 'get'});
    });

    it('setMutedAssistantTools', async () => {
        await client.setMutedAssistantTools(['mcp.grafana.query_prometheus']);
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/muted_tools`, {method: 'put', body: {tools: ['mcp.grafana.query_prometheus']}});
    });
});
