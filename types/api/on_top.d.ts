// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Antimatter: a message put on top of its channel, for a while or until removed (expires_at 0).
type OnTopPost = {
    post_id: string;
    channel_id: string;
    created_by: string;
    create_at: number;
    expires_at: number;
};
