// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {screen} from '@testing-library/react-native';
import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import RoleChips from './role_chips';

import type {CommunityGroup} from '@utils/community_groups';

describe('RoleChips', () => {
    it('should list the roles in their order', () => {
        const roles = [
            {id: 'mods', display_name: 'Moderators', color: '#e67e22'},
            {id: 'fans', display_name: 'Fans', color: ''},
        ] as CommunityGroup[];

        renderWithIntlAndTheme(<RoleChips roles={roles}/>);

        const chips = screen.getByTestId('user_profile.roles').children;
        expect(chips).toHaveLength(2);
        expect(screen.getByTestId('user_profile.roles.mods')).toHaveTextContent('Moderators');
        expect(screen.getByTestId('user_profile.roles.fans')).toHaveTextContent('Fans');
    });
});
