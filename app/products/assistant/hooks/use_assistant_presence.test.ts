// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {setAssistantPresence} from '@assistant/actions/remote/feed';
import {useIsFocused} from '@react-navigation/native';
import {act, renderHook} from '@testing-library/react-native';

import {useAssistantPresence} from './use_assistant_presence';

jest.mock('@assistant/actions/remote/feed');
jest.mock('@react-navigation/native', () => ({
    useIsFocused: jest.fn(() => true),
}));

const SERVER_URL = 'https://test.mattermost.com';

// `renderHook` itself is never wrapped in an outer `act(async () => {...})` here (mirrors
// use_next_meeting.test.ts, this codebase's own working pattern for an interval-driven
// hook): doing so corrupted the test renderer for every later test in this file ("Can't
// access .root on unmounted test renderer"). A bare `renderHook`/`rerender` call already
// gets RTL's own act handling; only the *subsequent* microtask flush for the mount
// effect's async work needs an explicit `await act(async () => { await Promise.resolve(); })`.
//
// Real timers throughout (no `jest.useFakeTimers()`): it deadlocks `act`'s own async
// flushing in this environment (its scheduler falls back to `setTimeout` under Node).
// `setInterval`/`clearInterval` are replaced outright (not merely spied on, which let a
// real 30s/45s OS timer through and hung the whole Jest process well past its test
// timeouts, since nothing here advances real time), so the heartbeat never creates a
// genuine timer; its callback is invoked directly to simulate a tick.
const flush = () => act(async () => {
    await Promise.resolve();
    await Promise.resolve();
});

describe('useAssistantPresence', () => {
    let setIntervalSpy: jest.SpiedFunction<typeof global.setInterval>;
    let clearIntervalSpy: jest.SpiedFunction<typeof global.clearInterval>;
    let nextHandle = 1;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useIsFocused).mockReturnValue(true);
        nextHandle = 1;
        setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => (nextHandle++) as unknown as NodeJS.Timeout);
        clearIntervalSpy = jest.spyOn(global, 'clearInterval').mockImplementation(() => undefined);
        jest.mocked(setAssistantPresence).mockResolvedValue({data: {following: true, ttl_seconds: 90, heartbeat_seconds: 30}});
    });

    afterEach(() => {
        setIntervalSpy.mockRestore();
        clearIntervalSpy.mockRestore();
    });

    it('opens presence on mount', async () => {
        renderHook(() => useAssistantPresence(SERVER_URL, 'channel1'));
        await flush();

        expect(setAssistantPresence).toHaveBeenCalledWith(SERVER_URL, 'channel1', true);
    });

    it('starts a 30s heartbeat and sends it on each tick', async () => {
        renderHook(() => useAssistantPresence(SERVER_URL, 'channel1'));
        await flush();

        expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
        jest.mocked(setAssistantPresence).mockClear();

        const tick = setIntervalSpy.mock.calls[0][0] as () => void;
        await act(async () => {
            tick();
            await Promise.resolve();
        });

        expect(setAssistantPresence).toHaveBeenCalledWith(SERVER_URL, 'channel1', true);
    });

    it('uses the server\'s own heartbeat_seconds once it answers', async () => {
        jest.mocked(setAssistantPresence).mockResolvedValue({data: {following: true, ttl_seconds: 90, heartbeat_seconds: 45}});

        renderHook(() => useAssistantPresence(SERVER_URL, 'channel1'));
        await flush();

        expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 45000);
    });

    it('closes presence and clears the same heartbeat interval on unmount', async () => {
        const {unmount} = renderHook(() => useAssistantPresence(SERVER_URL, 'channel1'));
        await flush();
        const handle = setIntervalSpy.mock.results[0].value;
        jest.mocked(setAssistantPresence).mockClear();

        unmount();

        expect(clearIntervalSpy).toHaveBeenCalledWith(handle);
        expect(setAssistantPresence).toHaveBeenCalledWith(SERVER_URL, 'channel1', false);
    });

    it('clears the old heartbeat and opens a new one on a channel switch', async () => {
        const {rerender} = renderHook(({channelId}) => useAssistantPresence(SERVER_URL, channelId), {
            initialProps: {channelId: 'channel1'},
        });
        await flush();
        const handle = setIntervalSpy.mock.results[0].value;
        jest.mocked(setAssistantPresence).mockClear();

        rerender({channelId: 'channel2'});
        await flush();

        expect(clearIntervalSpy).toHaveBeenCalledWith(handle);
        expect(setAssistantPresence).toHaveBeenCalledWith(SERVER_URL, 'channel1', false);
        expect(setAssistantPresence).toHaveBeenCalledWith(SERVER_URL, 'channel2', true);
    });

    it('clears the heartbeat when the screen loses focus, and reopens it when it regains focus', async () => {
        const {rerender} = renderHook(({focused}: {focused: boolean}) => {
            jest.mocked(useIsFocused).mockReturnValue(focused);
            return useAssistantPresence(SERVER_URL, 'channel1');
        }, {initialProps: {focused: true}});
        await flush();
        const handle = setIntervalSpy.mock.results[0].value;
        jest.mocked(setAssistantPresence).mockClear();

        rerender({focused: false});
        await flush();

        expect(clearIntervalSpy).toHaveBeenCalledWith(handle);
        expect(setAssistantPresence).toHaveBeenCalledWith(SERVER_URL, 'channel1', false);

        jest.mocked(setAssistantPresence).mockClear();
        rerender({focused: true});
        await flush();

        expect(setAssistantPresence).toHaveBeenCalledWith(SERVER_URL, 'channel1', true);
    });

    it('does nothing without a channel', async () => {
        renderHook(() => useAssistantPresence(SERVER_URL, undefined));
        await flush();

        expect(setAssistantPresence).not.toHaveBeenCalled();
        expect(setIntervalSpy).not.toHaveBeenCalled();
    });
});
