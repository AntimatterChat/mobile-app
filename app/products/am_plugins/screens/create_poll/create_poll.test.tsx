// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, fireEvent} from '@testing-library/react-native';
import React from 'react';

import {navigateBack} from '@screens/navigation';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import {createPoll} from '../../actions/remote/polls';

import CreatePoll from './index';

const mockSetOptions = jest.fn();

jest.mock('expo-router', () => ({
    useNavigation: jest.fn(() => ({
        setOptions: mockSetOptions,
    })),
}));

jest.mock('@screens/navigation', () => ({
    navigateBack: jest.fn(),
}));

jest.mock('@hooks/android_back_handler', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../../actions/remote/polls');

const SERVER_URL = 'https://appv1.mattermost.com';

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => SERVER_URL),
}));

function postButton() {
    const calls = mockSetOptions.mock.calls as Array<[{headerRight: () => React.ReactElement<{disabled: boolean; onPress: () => Promise<void>}>}]>;
    return calls[calls.length - 1][0].headerRight();
}

describe('CreatePoll', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(createPoll).mockResolvedValue({poll: {} as never});
    });

    it('should post a poll with the answers given and close', async () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <CreatePoll
                channelId='channel1'
                rootId='root1'
            />,
        );
        expect(postButton().props.disabled).toBe(true);

        fireEvent.changeText(getByTestId('create_poll.question.input'), ' Lunch? ');
        fireEvent.changeText(getByTestId('create_poll.answer.0'), 'Pizza');
        fireEvent.changeText(getByTestId('create_poll.answer.2'), 'Sushi');
        fireEvent(getByTestId('create_poll.multi.toggled.false.button'), 'valueChange', true);
        fireEvent.press(getByTestId('create_poll.duration.0'));
        expect(postButton().props.disabled).toBe(false);

        await act(async () => {
            await postButton().props.onPress();
        });
        expect(createPoll).toHaveBeenCalledWith(SERVER_URL, {
            channel_id: 'channel1',
            root_id: 'root1',
            question: 'Lunch?',
            options: ['Pizza', 'Sushi'],
            multi: true,
            anonymous: false,
            duration_minutes: 0,
        });
        expect(navigateBack).toHaveBeenCalled();
    });

    it('should ask for two answers', async () => {
        const {getByTestId, getByText} = renderWithIntlAndTheme(<CreatePoll channelId='channel1'/>);
        fireEvent.changeText(getByTestId('create_poll.question.input'), 'Lunch?');
        fireEvent.changeText(getByTestId('create_poll.answer.0'), 'Pizza');

        await act(async () => {
            await postButton().props.onPress();
        });
        expect(getByText('Add at least two answers')).toBeTruthy();
        expect(createPoll).not.toHaveBeenCalled();
    });

    it('should keep between two and ten answers', () => {
        const {getByTestId, queryByTestId, getByText} = renderWithIntlAndTheme(<CreatePoll channelId='channel1'/>);

        fireEvent.press(getByTestId('create_poll.answer.2.remove'));
        expect(queryByTestId('create_poll.answer.2')).toBeNull();
        fireEvent.press(getByTestId('create_poll.answer.1.remove'));
        expect(getByText('A poll needs at least two answers')).toBeTruthy();
        expect(getByTestId('create_poll.answer.1')).toBeTruthy();

        for (let i = 0; i < 8; i++) {
            fireEvent.press(getByTestId('create_poll.add_answer'));
        }
        expect(getByTestId('create_poll.answer.9')).toBeTruthy();
        fireEvent.press(getByTestId('create_poll.add_answer'));
        expect(getByText('Polls can have up to 10 answers')).toBeTruthy();
        expect(queryByTestId('create_poll.answer.10')).toBeNull();
    });

    it('should show why the poll couldn\'t be created and stay open', async () => {
        jest.mocked(createPoll).mockResolvedValue({error: new Error('a poll can last up to 30 days')});
        const {getByTestId, findByText} = renderWithIntlAndTheme(<CreatePoll channelId='channel1'/>);
        fireEvent.changeText(getByTestId('create_poll.question.input'), 'Lunch?');
        fireEvent.changeText(getByTestId('create_poll.answer.0'), 'Pizza');
        fireEvent.changeText(getByTestId('create_poll.answer.1'), 'Sushi');

        await act(async () => {
            await postButton().props.onPress();
        });
        expect(await findByText('The poll couldn\'t be created: a poll can last up to 30 days')).toBeTruthy();
        expect(navigateBack).not.toHaveBeenCalled();
    });
});
