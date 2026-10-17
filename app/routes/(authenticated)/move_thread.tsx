// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useIntl} from 'react-intl';

import {useTheme} from '@context/theme';
import {getHeaderOptions, useNavigationHeader} from '@hooks/navigation_header';
import {usePropsFromParams} from '@hooks/props_from_params';
import MoveThreadScreen, {type Props} from '@screens/move_thread';

export default function MoveThreadRoute() {
    const intl = useIntl();
    const theme = useTheme();
    const props = usePropsFromParams<Props>();

    useNavigationHeader({
        showWhenPushed: true,
        headerOptions: {
            headerTitle: intl.formatMessage({id: 'move_thread.title', defaultMessage: 'Move thread'}),
            ...getHeaderOptions(theme),
        },
    });

    return <MoveThreadScreen {...props}/>;
}
