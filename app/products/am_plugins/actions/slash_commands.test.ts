// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Screens} from '@constants';
import {navigateToScreen} from '@screens/navigation';

import {amPluginsStore} from '../store';

import {handleAmPluginsSlashCommand} from './slash_commands';

jest.mock('@screens/navigation', () => ({
    navigateToScreen: jest.fn(),
}));

const serverUrl = 'https://server.example.com';

describe('handleAmPluginsSlashCommand', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        amPluginsStore.clear(serverUrl);
    });

    it('should open the poll creation form for /poll alone', () => {
        amPluginsStore.setEnabledPlugins(serverUrl, ['com.antimatterchat.polls']);

        expect(handleAmPluginsSlashCommand(serverUrl, ' /poll ', 'channel1', 'root1')).toBe(true);
        expect(navigateToScreen).toHaveBeenCalledWith(Screens.AM_CREATE_POLL, {channelId: 'channel1', rootId: 'root1'});
    });

    it('should leave /poll with arguments, and /poll without the plugin, to the server', () => {
        amPluginsStore.setEnabledPlugins(serverUrl, ['com.antimatterchat.polls']);
        expect(handleAmPluginsSlashCommand(serverUrl, '/poll "Lunch?" "Pizza" "Sushi"', 'channel1')).toBe(false);

        amPluginsStore.setEnabledPlugins(serverUrl, []);
        expect(handleAmPluginsSlashCommand(serverUrl, '/poll', 'channel1')).toBe(false);
        expect(navigateToScreen).not.toHaveBeenCalled();
    });
});
