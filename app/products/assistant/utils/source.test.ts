// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {sourceFromTool} from './source';

describe('sourceFromTool', () => {
    it('capitalises the mcp server segment', () => {
        expect(sourceFromTool('mcp.grafana.query_prometheus', 'Query Prometheus')).toBe('Grafana');
    });

    it('falls back to tool_title when the tool name is not mcp.<server>...', () => {
        expect(sourceFromTool('builtin.summary', 'Summary')).toBe('Summary');
    });

    it('falls back to the raw tool name when there is no title either', () => {
        expect(sourceFromTool('builtin.summary', '')).toBe('builtin.summary');
    });
});
