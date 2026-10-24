// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {useIntl} from 'react-intl';
import {Platform} from 'react-native';

import {goToAssistant} from '@assistant/screens/navigation';
import OptionItem from '@components/option_item';
import SlideUpPanelItem from '@components/slide_up_panel_item';
import {dismissBottomSheet} from '@screens/navigation';

type Props = {
    channelId: string;
    showAsLabel?: boolean;
    testID?: string;
}

// AssistantOption is the ambient assistant's only entry point on mobile (decisions of
// 2026-10-24): the channel's quick actions / "…" menu. There is nothing the server
// exposes to a plain member that says whether the assistant is on for the community
// (only the community's own admins can read that, via GET .../settings), so the entry
// is always shown; the screen itself says when it's off, from GET /feed's own
// `enabled` flag.
const AssistantOption = ({
    channelId,
    showAsLabel,
    testID,
}: Props) => {
    const intl = useIntl();

    const label = intl.formatMessage({id: 'assistant.channel_actions.open', defaultMessage: 'Assistant'});

    const openAssistant = useCallback(async () => {
        await dismissBottomSheet();
        goToAssistant(channelId);
    }, [channelId]);

    if (showAsLabel) {
        return (
            <SlideUpPanelItem
                onPress={openAssistant}
                text={label}
                leftIcon='creation-outline'
                testID={testID}
            />
        );
    }

    return (
        <OptionItem
            action={openAssistant}
            label={label}
            icon='creation-outline'
            type={Platform.select({ios: 'arrow', default: 'default'})}
            testID={testID}
        />
    );
};

export default AssistantOption;
