// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useIntl} from 'react-intl';

import {useTheme} from '@context/theme';
import {getHeaderOptions, useNavigationHeader} from '@hooks/navigation_header';
import {usePropsFromParams} from '@hooks/props_from_params';
import CommunityPrivacyScreen from '@screens/community_privacy';

type CommunityPrivacyRouteProps = {
    teamId: string;
}

export default function CommunityPrivacyRoute() {
    const intl = useIntl();
    const theme = useTheme();
    const {teamId} = usePropsFromParams<CommunityPrivacyRouteProps>();

    useNavigationHeader({
        showWhenPushed: true,
        headerOptions: {
            headerTitle: intl.formatMessage({id: 'community_privacy.header_title', defaultMessage: 'Privacy settings'}),
            ...getHeaderOptions(theme),
        },
    });

    return (<CommunityPrivacyScreen teamId={teamId}/>);
}
