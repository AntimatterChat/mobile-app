// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import AssistantScreen from '@assistant/screens/assistant';
import {useIntl} from 'react-intl';

import {useTheme} from '@context/theme';
import {getHeaderOptions, useNavigationHeader} from '@hooks/navigation_header';
import {usePropsFromParams} from '@hooks/props_from_params';

type Params = {
    channelId: string;
};

export default function AssistantRoute() {
    const theme = useTheme();
    const intl = useIntl();
    const {channelId} = usePropsFromParams<Params>();

    useNavigationHeader({
        showWhenPushed: true,
        headerOptions: {
            headerTitle: intl.formatMessage({id: 'assistant.screen.title', defaultMessage: 'Assistant'}),
            ...getHeaderOptions(theme),
        },
    });

    return (<AssistantScreen channelId={channelId}/>);
}
