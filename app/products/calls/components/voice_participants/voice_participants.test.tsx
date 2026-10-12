// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {screen} from '@testing-library/react-native';
import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import VoiceParticipants from './voice_participants';

jest.mock('@components/profile_picture', () => () => null);

describe('VoiceParticipants', () => {
    it('should list the people with their mute, deafen, hand and screen state', () => {
        const users = [
            TestHelper.fakeUserModel({id: 'u1', username: 'maya'}),
            TestHelper.fakeUserModel({id: 'u2', username: 'leo'}),
        ];
        const participants = [
            {sessionId: 's1', userId: 'u1', muted: true, deafened: true, speaking: false, raisedHand: false, screenSharing: false},
            {sessionId: 's2', userId: 'u2', muted: true, deafened: false, speaking: true, raisedHand: true, screenSharing: true},
        ];

        renderWithIntlAndTheme(
            <VoiceParticipants
                channelId='voice1'
                participants={participants}
                users={users}
                teammateNameDisplay='username'
            />,
        );

        expect(screen.getByText('maya')).toBeVisible();
        expect(screen.getByText('leo')).toBeVisible();
        expect(screen.getByTestId('voice_participants.s1.deafened')).toBeVisible();
        expect(screen.queryByTestId('voice_participants.s1.muted')).toBeNull();
        expect(screen.getByTestId('voice_participants.s2.muted')).toBeVisible();
        expect(screen.getByTestId('voice_participants.s2.hand')).toBeVisible();
        expect(screen.getByText('LIVE')).toBeVisible();
    });
});
