// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// sourceFromTool names the system an insight card's data came from, for the "Post to
// channel" warning ("Some people in this channel may not have access to <source>"):
// an MCP tool name is "mcp.<server>.<action>" (ASSISTANT_API.md's own examples,
// e.g. "mcp.grafana.query_prometheus"), so the server segment names the source. Falls
// back to the card's own tool_title when the tool name doesn't follow that shape.
export function sourceFromTool(tool: string, toolTitle: string): string {
    const parts = tool.split('.');
    if (parts.length >= 2 && parts[0] === 'mcp' && parts[1]) {
        const name = parts[1];
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return toolTitle || tool;
}
