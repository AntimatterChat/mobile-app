// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// The ambient assistant's stage 1 API (ASSISTANT_API.md): a native server feature (not a
// plugin), under /api/v4/assistant.

// Defaults from ASSISTANT_API.md, used until the server's own presence response answers
// with its own values.
export const ASSISTANT_DEFAULT_HEARTBEAT_SECONDS = 30;
export const ASSISTANT_DEFAULT_TTL_SECONDS = 90;

// "Don't suggest this kind again" mutes the card's tool for the person, everywhere; the
// server caps the muted list at this many tools.
export const ASSISTANT_MAX_MUTED_TOOLS = 200;

// A sparkline is only worth drawing with at least this many points.
export const ASSISTANT_MIN_SPARKLINE_POINTS = 2;
