// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, fireEvent, waitFor} from '@testing-library/react-native';
import React from 'react';
import {Alert} from 'react-native';

import {renderWithEverything} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import {closePoll, fetchPoll, togglePollVote} from '../../actions/remote/polls';

import PollPost from './poll_post';

import type {Poll} from '../../types';
import type {Database} from '@nozbe/watermelondb';

jest.mock('../../actions/remote/polls');
jest.mock('@actions/remote/user');

const SERVER_URL = 'https://appv1.mattermost.com';

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => SERVER_URL),
}));

const poll = (overrides: Partial<Poll> = {}): Poll => ({
    id: 'poll1',
    post_id: 'post1',
    channel_id: 'channel1',
    creator_id: 'creator',
    question: 'What colour temperature do you use in the evening?',
    options: [{text: 'Candle', votes: 2}, {text: 'Warm', votes: 1}],
    multi: false,
    anonymous: true,
    create_at: 0,
    closed: false,
    voter_count: 3,
    my_votes: [0],
    ...overrides,
});

describe('PollPost', () => {
    let database: Database;
    const post = TestHelper.fakePostModel({id: 'post1', channelId: 'channel1', type: 'custom_poll', props: {poll_id: 'poll1'}});

    beforeAll(async () => {
        const server = await TestHelper.setupServerDatabase(SERVER_URL);
        database = server.database;
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(fetchPoll).mockResolvedValue({poll: poll()});
        jest.mocked(togglePollVote).mockResolvedValue({poll: poll()});
        jest.mocked(closePoll).mockResolvedValue({poll: poll({closed: true})});
    });

    it('should load the poll and say so meanwhile', async () => {
        const {getByText} = renderWithEverything(
            <PollPost
                post={post}
                currentUserId='me'
                canModerate={false}
            />,
            {database},
        );

        expect(getByText('Loading the poll…')).toBeTruthy();
        await waitFor(() => expect(fetchPoll).toHaveBeenCalledWith(SERVER_URL, 'poll1'));
    });

    it('should say when the poll is no longer available', async () => {
        jest.mocked(fetchPoll).mockResolvedValue({error: new Error('not found')});
        const {findByText} = renderWithEverything(
            <PollPost
                post={post}
                currentUserId='me'
                canModerate={false}
            />,
            {database},
        );

        expect(await findByText('This poll is no longer available.')).toBeTruthy();
    });

    it('should show the question, the answers and their results', () => {
        const {getByText} = renderWithEverything(
            <PollPost
                post={post}
                poll={poll()}
                currentUserId='me'
                canModerate={false}
            />,
            {database},
        );

        expect(getByText('What colour temperature do you use in the evening?')).toBeTruthy();
        expect(getByText('Select one answer · Anonymous')).toBeTruthy();
        expect(getByText('Candle')).toBeTruthy();
        expect(getByText('67%')).toBeTruthy();
        expect(getByText('33%')).toBeTruthy();
        expect(getByText('3 votes')).toBeTruthy();
        expect(fetchPoll).not.toHaveBeenCalled();
    });

    it('should vote for an answer when it is tapped', async () => {
        const {getByTestId} = renderWithEverything(
            <PollPost
                post={post}
                poll={poll()}
                currentUserId='me'
                canModerate={false}
            />,
            {database},
        );

        await act(async () => {
            fireEvent.press(getByTestId('poll_post.option.1'));
        });
        expect(togglePollVote).toHaveBeenCalledWith(SERVER_URL, poll(), 1);
    });

    it('should show why a vote failed', async () => {
        jest.mocked(togglePollVote).mockResolvedValue({error: new Error('the poll is closed')});
        const {getByTestId, findByText} = renderWithEverything(
            <PollPost
                post={post}
                poll={poll()}
                currentUserId='me'
                canModerate={false}
            />,
            {database},
        );

        await act(async () => {
            fireEvent.press(getByTestId('poll_post.option.0'));
        });
        expect(await findByText('Your vote couldn\'t be saved: the poll is closed')).toBeTruthy();
    });

    it('should show the final results of a closed poll and take no votes', async () => {
        const {getByText, getByTestId, queryByTestId} = renderWithEverything(
            <PollPost
                post={post}
                poll={poll({closed: true})}
                currentUserId='creator'
                canModerate={false}
            />,
            {database},
        );

        expect(getByText('· Final results')).toBeTruthy();
        expect(queryByTestId('poll_post.close')).toBeNull();
        await act(async () => {
            fireEvent.press(getByTestId('poll_post.option.0'));
        });
        expect(togglePollVote).not.toHaveBeenCalled();
    });

    it('should let the creator and moderators close the poll after confirming', async () => {
        const alert = jest.spyOn(Alert, 'alert');
        const {getByTestId, rerender, queryByTestId} = renderWithEverything(
            <PollPost
                post={post}
                poll={poll()}
                currentUserId='someone'
                canModerate={false}
            />,
            {database},
        );
        expect(queryByTestId('poll_post.close')).toBeNull();

        rerender(
            <PollPost
                post={post}
                poll={poll()}
                currentUserId='creator'
                canModerate={false}
            />,
        );
        fireEvent.press(getByTestId('poll_post.close'));
        expect(alert).toHaveBeenCalled();

        const buttons = alert.mock.calls[0][2]!;
        await act(async () => {
            await buttons[1].onPress!();
        });
        expect(closePoll).toHaveBeenCalledWith(SERVER_URL, 'poll1');

        rerender(
            <PollPost
                post={post}
                poll={poll()}
                currentUserId='someone'
                canModerate={true}
            />,
        );
        expect(getByTestId('poll_post.close')).toBeTruthy();
    });

    it('should tell when the poll ends', () => {
        const {getByText} = renderWithEverything(
            <PollPost
                post={post}
                poll={poll({end_at: Date.now() + (3 * 3600000) + 1000, multi: true, anonymous: false})}
                currentUserId='me'
                canModerate={false}
            />,
            {database},
        );

        expect(getByText('Select one or more answers')).toBeTruthy();
        expect(getByText('· Ends in 3 hours')).toBeTruthy();
    });
});
