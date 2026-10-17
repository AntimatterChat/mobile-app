// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useIntl} from 'react-intl';

import {useTheme} from '@context/theme';
import {getHeaderOptions, useNavigationHeader} from '@hooks/navigation_header';
import {usePropsFromParams} from '@hooks/props_from_params';
import NameThreadScreen, {type Props} from '@screens/name_thread';

export default function NameThreadRoute() {
    const intl = useIntl();
    const theme = useTheme();
    const props = usePropsFromParams<Props>();

    useNavigationHeader({
        showWhenPushed: true,
        headerOptions: {
            headerTitle: props.currentTitle ? intl.formatMessage({id: 'name_thread.rename_title', defaultMessage: 'Rename the topic'}) : intl.formatMessage({id: 'name_thread.title', defaultMessage: 'Make it a topic'}),
            ...getHeaderOptions(theme),
        },
    });

    return <NameThreadScreen {...props}/>;
}
