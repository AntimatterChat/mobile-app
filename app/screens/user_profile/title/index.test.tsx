// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import UserProfileTitle from './index';

function getBaseProps() {
    return {
        enablePostIconOverride: false,
        enablePostUsernameOverride: false,
        isChannelAdmin: false,
        isSystemAdmin: false,
        isTeamAdmin: false,
        teammateDisplayName: 'username',
        user: TestHelper.fakeUserModel({id: 'user1', username: 'user1'}),
        hideGuestTags: false,
    };
}

describe('UserProfileTitle community nickname', () => {
    it('should show the global display name when there is no community nickname', () => {
        const {getByTestId, queryByTestId} = renderWithIntlAndTheme(<UserProfileTitle {...getBaseProps()}/>);

        expect(getByTestId('user_profile.display_name')).toHaveTextContent('@user1');
        expect(queryByTestId('user_profile.outside_this_community')).toBeNull();
    });

    it('should show the community nickname, with a note of the global name, when given one', () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <UserProfileTitle
                {...getBaseProps()}
                communityNickname='Nicky'
            />,
        );

        expect(getByTestId('user_profile.display_name')).toHaveTextContent('Nicky');
        expect(getByTestId('user_profile.outside_this_community')).toHaveTextContent('Outside this community: @user1');
    });

    it("should not show the community nickname when a webhook's own override is in effect", () => {
        const {getByTestId, queryByTestId} = renderWithIntlAndTheme(
            <UserProfileTitle
                {...getBaseProps()}
                enablePostUsernameOverride={true}
                usernameOverride='webhook_user'
                communityNickname='Nicky'
            />,
        );

        expect(getByTestId('user_profile.display_name')).toHaveTextContent('webhook_user');
        expect(queryByTestId('user_profile.outside_this_community')).toBeNull();
    });
});
