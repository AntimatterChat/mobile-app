// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import AssistantScreens from '@assistant/constants/screens';

import {navigateToScreen} from '@screens/navigation';

// goToAssistant opens the Assistant screen for a channel: the entry point is the channel
// header's quick actions (its "…" menu), and this is the only way to reach the screen.
export function goToAssistant(channelId: string) {
    navigateToScreen(AssistantScreens.ASSISTANT, {channelId});
}
