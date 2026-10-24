// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import keyMirror from '@utils/key_mirror';
const ManageOptions = keyMirror({
    REMOVE_USER: null,
    MAKE_CHANNEL_ADMIN: null,
    MAKE_CHANNEL_MEMBER: null,

    // A moderator's own reset of a member's community profile, when it breaks the community's rules; shown only
    // when that member has set one (see manage_user_options.tsx).
    RESET_NICKNAME: null,
    RESET_AVATAR: null,
});

export type ManageOptionsTypes = keyof typeof ManageOptions

export default {
    ManageOptions,
};

