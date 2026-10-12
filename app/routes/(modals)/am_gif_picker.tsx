// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useIntl} from 'react-intl';

import GifPicker, {messages, type GifPickerProps} from '@am_plugins/screens/gif_picker';
import {useTheme} from '@context/theme';
import {getModalHeaderOptions, useNavigationHeader} from '@hooks/navigation_header';
import {usePropsFromParams} from '@hooks/props_from_params';
import {navigateBack} from '@screens/navigation';

export default function GifPickerRoute() {
    const intl = useIntl();
    const theme = useTheme();
    const props = usePropsFromParams<GifPickerProps>();

    useNavigationHeader({
        showWhenPushed: true,
        headerOptions: {
            headerTitle: intl.formatMessage(messages.title),
            ...getModalHeaderOptions(theme, navigateBack, 'close.gif_picker.button'),
        },
    });

    return (<GifPicker {...props}/>);
}
