// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import General from './general';

describe('General', () => {
    it('lets a group message hold up to 10 people: you and 9 others, as the server allows', () => {
        expect(General.MAX_USERS_IN_GM).toBe(9);
        expect(General.MIN_USERS_IN_GM).toBe(3);
    });
});
