// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useEffect, useMemo, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';

import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {navigateToScreen} from '@screens/navigation';

import {GIFS_PLUGIN_ID, POLLS_PLUGIN_ID} from '../constants';
import {amPluginsStore} from '../store';

import type {CompassIconName} from '@components/compass_icon';

// An item the plugins add to the composer's "+" menu.
export type ComposerPluginAction = {
    id: string;
    icon: CompassIconName;
    text: string;
    onPress: () => void;
};

export const composerMessages = defineMessages({
    createPoll: {id: 'am_plugins.polls.create', defaultMessage: 'Create a poll'},
    gifOrSticker: {id: 'am_plugins.gifs.menu_item', defaultMessage: 'GIF or sticker'},
});

// openCreatePoll opens the poll creation form for a channel or thread.
export function openCreatePoll(channelId: string, rootId?: string) {
    navigateToScreen(Screens.AM_CREATE_POLL, {channelId, rootId: rootId || ''});
}

// openGifPicker opens the GIF and sticker picker for a channel or thread.
export function openGifPicker(channelId: string, rootId?: string) {
    navigateToScreen(Screens.AM_GIF_PICKER, {channelId, rootId: rootId || ''});
}

// usePluginEnabled tells whether the server runs a plugin.
export function usePluginEnabled(pluginId: string) {
    const serverUrl = useServerUrl();
    const [enabled, setEnabled] = useState(() => amPluginsStore.isPluginEnabled(serverUrl, pluginId));
    useEffect(() => {
        const subscription = amPluginsStore.observePluginEnabled(serverUrl, pluginId).subscribe(setEnabled);
        return () => subscription.unsubscribe();
    }, [serverUrl, pluginId]);
    return enabled;
}

// useComposerPluginActions returns the items the server's plugins add to the composer's "+" menu,
// as they do in the Fusion web UI: creating a poll, and sending a GIF or sticker.
export function useComposerPluginActions(channelId?: string, rootId?: string): ComposerPluginAction[] {
    const intl = useIntl();
    const polls = usePluginEnabled(POLLS_PLUGIN_ID);
    const gifs = usePluginEnabled(GIFS_PLUGIN_ID);

    return useMemo(() => {
        const actions: ComposerPluginAction[] = [];
        if (!channelId) {
            return actions;
        }
        if (polls) {
            actions.push({
                id: 'create_poll',
                icon: 'chart-bar',
                text: intl.formatMessage(composerMessages.createPoll),
                onPress: () => openCreatePoll(channelId, rootId),
            });
        }
        if (gifs) {
            actions.push({
                id: 'gif_picker',
                icon: 'file-gif',
                text: intl.formatMessage(composerMessages.gifOrSticker),
                onPress: () => openGifPicker(channelId, rootId),
            });
        }
        return actions;
    }, [channelId, rootId, polls, gifs, intl]);
}
