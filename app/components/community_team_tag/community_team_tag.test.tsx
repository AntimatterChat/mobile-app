// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent, screen} from '@testing-library/react-native';
import React from 'react';

import {openCommunityTeam} from '@screens/community_team';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import CommunityTeamTag from './index';

import type {CommunityGroup} from '@utils/community_groups';

jest.mock('@screens/community_team', () => ({openCommunityTeam: jest.fn()}));

describe('CommunityTeamTag', () => {
    const team = {id: 'team', name: 'beta', display_name: 'Beta squad', tag: 'BETA', source: 'custom', description: '', delete_at: 0} as CommunityGroup;

    it('should show the tag and open the team card when tapped', () => {
        renderWithIntlAndTheme(<CommunityTeamTag team={team}/>);

        expect(screen.getByText('BETA')).toBeVisible();
        fireEvent.press(screen.getByLabelText('Beta squad'));
        expect(openCommunityTeam).toHaveBeenCalledWith(team);
    });
});
