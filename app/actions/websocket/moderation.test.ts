// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fetchMyTeamTimeout} from '@actions/remote/member_timeout';

import {handleModerationEvents} from './moderation';

jest.mock('@actions/remote/member_timeout', () => ({fetchMyTeamTimeout: jest.fn()}));

describe('handleModerationEvents', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reload the current user\'s timeout when a team\'s timeouts change', () => {
        handleModerationEvents('server', {event: 'member_timeouts_updated', data: {team_id: 't1'}, broadcast: {team_id: 't1'}} as WebSocketMessage);
        expect(fetchMyTeamTimeout).toHaveBeenCalledWith('server', 't1');
    });

    it('should leave other events alone', () => {
        handleModerationEvents('server', {event: 'posted', data: {}, broadcast: {team_id: 't1'}} as WebSocketMessage);
        expect(fetchMyTeamTimeout).not.toHaveBeenCalled();
    });
});
