// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';

import {observeCurrentUserId} from '@queries/servers/system';

import MeetingPost, {isCalendarMeetingPost} from './meeting_post';

import type {WithDatabaseArgs} from '@typings/database/database';
import type PostModel from '@typings/database/models/servers/post';

export {isCalendarMeetingPost};

type OwnProps = WithDatabaseArgs & {
    post: PostModel;
    isReplyPost: boolean;
};

const enhanced = withObservables([], ({database}: OwnProps) => ({
    currentUserId: observeCurrentUserId(database),
}));

export default withDatabase(enhanced(MeetingPost));
