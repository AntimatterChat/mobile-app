// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import UserItem from './user_item';

import type {UserItemProps} from './user_item';

jest.mock('@components/profile_picture', () => {
    const {View} = require('react-native');
    return (props: {source?: {uri: string}; testID?: string}) => (
        <View
            testID={`${props.testID}.source.${props.source?.uri || 'none'}`}
        />
    );
});

function getBaseProps(): UserItemProps {
    return {
        user: {id: 'user1', username: 'user1', roles: ''} as UserProfile,
        currentUserId: 'current-user-id',
        testID: 'user_item',
        isCustomStatusEnabled: false,
        teammateNameDisplay: 'username',
        hideGuestTags: false,
    };
}

describe('UserItem', () => {
    it("should show the global display name when there is no community nickname", () => {
        const {getByTestId} = renderWithIntlAndTheme(<UserItem {...getBaseProps()}/>);

        expect(getByTestId('user_item.user1.display_name')).toHaveTextContent('user1');
    });

    it('should show the community nickname instead of the global display name when given one', () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <UserItem
                {...getBaseProps()}
                communityNickname='Nicky'
            />,
        );

        expect(getByTestId('user_item.user1.display_name')).toHaveTextContent('Nicky');
    });

    it("should pass the community avatar source to ProfilePicture when given one", () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <UserItem
                {...getBaseProps()}
                communityAvatarSource={{uri: 'https://example.com/avatar.png'}}
            />,
        );

        expect(getByTestId('user_item.user1.profile_picture.source.https://example.com/avatar.png')).toBeTruthy();
    });
});
