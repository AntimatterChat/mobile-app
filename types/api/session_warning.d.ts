// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Antimatter: a sign-in to your account, as the server tells your other sessions (session_created): the session's
// id and what the sessions list shows of it, never its token.
type SignIn = {
    session_id: string;
    create_at: number;
    platform: string;
    os: string;
    browser: string;
    mobile: boolean;
}
