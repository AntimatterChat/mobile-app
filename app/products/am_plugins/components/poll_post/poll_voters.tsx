// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import React from 'react';
import {defineMessages} from 'react-intl';

import UserAvatarsStack from '@components/user_avatars_stack';
import {Screens} from '@constants';
import {queryUsersById} from '@queries/servers/user';

import type {WithDatabaseArgs} from '@typings/database/database';
import type UserModel from '@typings/database/models/servers/user';

const messages = defineMessages({
    title: {id: 'am_plugins.polls.voters_title', defaultMessage: 'Voted for this answer'},
});

const MAX_FACES = 3;

const avatarStyle = {width: 20, height: 20, borderRadius: 10, borderWidth: 1};

type Props = {
    channelId: string;
    users: UserModel[];
};

// PollVoters shows the faces of who voted for an answer; tapping them lists them all.
const PollVoters = ({channelId, users}: Props) => {
    if (!users.length) {
        return null;
    }
    return (
        <UserAvatarsStack
            breakAt={MAX_FACES}
            channelId={channelId}
            location={Screens.CHANNEL}
            users={users}
            avatarStyle={avatarStyle}
            overflowContainerStyle={avatarStyle}
            overflowItemStyle={avatarStyle}
            bottomSheetTitle={messages.title}
        />
    );
};

type OwnProps = WithDatabaseArgs & {
    voterIds: string[];
};

const enhanced = withObservables(['voterIds'], ({database, voterIds}: OwnProps) => ({
    users: queryUsersById(database, voterIds).observe(),
}));

export default withDatabase(enhanced(PollVoters));
