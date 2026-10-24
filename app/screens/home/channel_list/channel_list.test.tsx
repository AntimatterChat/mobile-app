// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {act, type ComponentProps} from 'react';

import {fetchCommunityRules} from '@actions/remote/community_rules';
import PerformanceMetricsManager from '@managers/performance_metrics_manager';
import {getCommunityRules} from '@store/community_rules_store';
import {renderWithEverything, waitFor} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import ChannelListScreen from './channel_list';

import type {Database} from '@nozbe/watermelondb';

jest.mock('@managers/performance_metrics_manager');
jest.mock('@actions/remote/community_rules');
jest.mock('@store/community_rules_store');
jest.mock('@react-navigation/native', () => ({
    useIsFocused: () => true,
    useNavigation: () => ({isFocused: () => true}),
    useRoute: () => ({}),
}));

jest.mock('@react-native-camera-roll/camera-roll', () => ({
    CameraRoll: {
        save: jest.fn().mockResolvedValue('path'),
    },
}));

function getBaseProps(): ComponentProps<typeof ChannelListScreen> {
    return {
        hasChannels: true,
        hasCurrentUser: true,
        hasMoreThanOneTeam: true,
        hasTeams: true,
        isCRTEnabled: true,
        launchType: 'normal',
        showIncomingCalls: true,
        showToS: false,
        mustAcceptCommunityRules: false,
        currentUserId: 'someId',
        currentTeamId: 'someTeamId',
    };
}

describe('performance metrics', () => {
    let database: Database;
    const serverUrl = 'http://www.someserverurl.com';
    beforeAll(async () => {
        const server = await TestHelper.setupServerDatabase(serverUrl);
        database = server.database;
    });

    afterAll(async () => {
        await TestHelper.tearDown(serverUrl);
    });

    it('finish load on load', async () => {
        const props = getBaseProps();
        renderWithEverything(<ChannelListScreen {...props}/>, {database, serverUrl});
        await act(async () => {
            expect(PerformanceMetricsManager.finishLoad).toHaveBeenCalledWith('HOME', serverUrl);
        });
    });
});

describe('team sidebar visibility', () => {
    let database: Database;
    const serverUrl = 'http://www.someserverurl.com';

    beforeAll(async () => {
        const server = await TestHelper.setupServerDatabase(serverUrl);
        database = server.database;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render when canJoinOtherTeams is true and user has only one team', async () => {
        const props = getBaseProps();
        props.hasMoreThanOneTeam = false;
        const {getByTestId} = renderWithEverything(<ChannelListScreen {...props}/>, {database, serverUrl});
        await waitFor(() => {
            expect(getByTestId('channel_list.screen')).toBeTruthy();
        });
    });

    it('should render when canJoinOtherTeams is false and user has only one team', async () => {
        const props = getBaseProps();
        props.hasMoreThanOneTeam = false;
        const {getByTestId} = renderWithEverything(<ChannelListScreen {...props}/>, {database, serverUrl});
        await waitFor(() => {
            expect(getByTestId('channel_list.screen')).toBeTruthy();
        });
    });
});

describe('community rules', () => {
    let database: Database;
    const serverUrl = 'http://www.someserverurl.com';

    beforeAll(async () => {
        const server = await TestHelper.setupServerDatabase(serverUrl);
        database = server.database;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("fetches the current team's rules once, when they are not cached yet", async () => {
        jest.mocked(getCommunityRules).mockReturnValue(undefined);
        const props = getBaseProps();

        renderWithEverything(<ChannelListScreen {...props}/>, {database, serverUrl});

        await waitFor(() => {
            expect(fetchCommunityRules).toHaveBeenCalledWith(serverUrl, 'someTeamId');
        });
    });

    it('does not refetch the rules once they are already cached', async () => {
        jest.mocked(getCommunityRules).mockReturnValue({
            team_id: 'someTeamId', enabled: true, text: 'Be kind.', version: 1, updated_by: 'admin', update_at: 1, accepted_version: 1, must_accept: false,
        });
        const props = getBaseProps();

        renderWithEverything(<ChannelListScreen {...props}/>, {database, serverUrl});

        await waitFor(() => {
            expect(fetchCommunityRules).not.toHaveBeenCalled();
        });
    });
});
