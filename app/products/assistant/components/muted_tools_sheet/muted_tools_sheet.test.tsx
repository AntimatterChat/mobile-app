// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fetchMutedAssistantTools, unmuteAssistantTool} from '@assistant/actions/remote/feed';
import {assistantStore} from '@assistant/store';
import {fireEvent} from '@testing-library/react-native';
import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import MutedToolsSheet from './muted_tools_sheet';

const SERVER_URL = 'https://test.mattermost.com';

jest.mock('@assistant/actions/remote/feed');
jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => 'https://test.mattermost.com'),
}));

describe('MutedToolsSheet', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        assistantStore.clear(SERVER_URL);
        jest.mocked(fetchMutedAssistantTools).mockResolvedValue({data: []});
        jest.mocked(unmuteAssistantTool).mockResolvedValue({data: []});
    });

    it('fetches the muted tools on mount', () => {
        renderWithIntlAndTheme(<MutedToolsSheet/>);
        expect(fetchMutedAssistantTools).toHaveBeenCalledWith(SERVER_URL);
    });

    it('shows an empty message when nothing is muted', () => {
        const {getByTestId} = renderWithIntlAndTheme(<MutedToolsSheet/>);
        expect(getByTestId('assistant.muted_tools_sheet.empty')).toBeTruthy();
    });

    it('lists each muted tool with an Unmute button', () => {
        assistantStore.setMutedTools(SERVER_URL, ['mcp.grafana.query_prometheus', 'mcp.ci.deploy']);
        const {getByTestId, queryByTestId} = renderWithIntlAndTheme(<MutedToolsSheet/>);

        expect(getByTestId('assistant.muted_tools_sheet.row.mcp.grafana.query_prometheus')).toBeTruthy();
        expect(getByTestId('assistant.muted_tools_sheet.row.mcp.ci.deploy')).toBeTruthy();
        expect(queryByTestId('assistant.muted_tools_sheet.empty')).toBeNull();
    });

    it('unmutes the pressed tool', () => {
        assistantStore.setMutedTools(SERVER_URL, ['mcp.grafana.query_prometheus']);
        const {getByTestId} = renderWithIntlAndTheme(<MutedToolsSheet/>);

        fireEvent.press(getByTestId('assistant.muted_tools_sheet.unmute.mcp.grafana.query_prometheus'));

        expect(unmuteAssistantTool).toHaveBeenCalledWith(SERVER_URL, 'mcp.grafana.query_prometheus');
    });
});
