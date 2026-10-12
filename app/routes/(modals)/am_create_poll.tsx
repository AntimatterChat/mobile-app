// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useIntl} from 'react-intl';

import CreatePoll, {createPollTitle, type CreatePollProps} from '@am_plugins/screens/create_poll';
import {useTheme} from '@context/theme';
import {getModalHeaderOptions, useNavigationHeader} from '@hooks/navigation_header';
import {usePropsFromParams} from '@hooks/props_from_params';
import {navigateBack} from '@screens/navigation';

export default function CreatePollRoute() {
    const intl = useIntl();
    const theme = useTheme();
    const props = usePropsFromParams<CreatePollProps>();

    useNavigationHeader({
        showWhenPushed: true,
        headerOptions: {
            headerTitle: intl.formatMessage(createPollTitle),
            ...getModalHeaderOptions(theme, navigateBack, 'close.create_poll.button'),
        },
    });

    return (<CreatePoll {...props}/>);
}
