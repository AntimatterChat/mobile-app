// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, fireEvent} from '@testing-library/react-native';
import React from 'react';
import {Alert} from 'react-native';

import {setThreadTitle} from '@actions/remote/thread_title';
import {navigateBack} from '@screens/navigation';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import NameThread from './name_thread';

jest.mock('@screens/navigation', () => ({navigateBack: jest.fn()}));
jest.mock('@utils/keyboard', () => ({dismissKeyboard: jest.fn()}));
jest.mock('@hooks/android_back_handler', () => jest.fn());
jest.mock('@actions/remote/thread_title', () => ({setThreadTitle: jest.fn(() => Promise.resolve({}))}));
jest.mock('@context/server', () => ({useServerUrl: jest.fn(() => 'some.server.url')}));

const mockSetOptions = jest.fn();
jest.mock('expo-router', () => ({
    useNavigation: jest.fn(() => ({setOptions: mockSetOptions})),
}));

function headerRight() {
    return mockSetOptions.mock.lastCall?.[0].headerRight();
}

describe('NameThread', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should save a new name, and only a new one', async () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <NameThread
                rootId='root-id'
                currentTitle='Release'
            />,
        );

        expect(headerRight().props.disabled).toBe(true);

        fireEvent.changeText(getByTestId('name_thread.input'), 'Release 2.1');
        expect(headerRight().props.disabled).toBe(false);

        await act(async () => {
            await headerRight().props.onPress();
        });
        expect(setThreadTitle).toHaveBeenCalledWith('some.server.url', 'root-id', 'Release 2.1');
        expect(navigateBack).toHaveBeenCalled();
    });

    it('should explain topics, and how to make one a plain thread again', () => {
        const {getByText, queryByTestId, rerender} = renderWithIntlAndTheme(
            <NameThread
                rootId='root-id'
                currentTitle=''
            />,
        );

        expect(getByText(/^A topic is a named conversation inside its channel/)).toBeTruthy();
        expect(queryByTestId('name_thread.lead_rename')).toBeNull();

        rerender(
            <NameThread
                rootId='root-id'
                currentTitle='Release'
            />,
        );
        expect(getByText('Leave the name empty to make it a plain thread again.')).toBeTruthy();
    });

    it('should say the topic could not be saved', async () => {
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        jest.mocked(setThreadTitle).mockResolvedValueOnce({error: new Error('nope')} as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        const {getByTestId} = renderWithIntlAndTheme(
            <NameThread
                rootId='root-id'
                currentTitle=''
            />,
        );

        fireEvent.changeText(getByTestId('name_thread.input'), 'Release');
        await act(async () => {
            await headerRight().props.onPress();
        });
        expect(alert).toHaveBeenCalledWith('The topic couldn\'t be saved', expect.anything());
        expect(navigateBack).not.toHaveBeenCalled();
    });

    it('should take the name away when emptied', async () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <NameThread
                rootId='root-id'
                currentTitle='Release'
            />,
        );

        fireEvent.changeText(getByTestId('name_thread.input'), '');
        await act(async () => {
            await headerRight().props.onPress();
        });
        expect(setThreadTitle).toHaveBeenCalledWith('some.server.url', 'root-id', '');
    });
});
