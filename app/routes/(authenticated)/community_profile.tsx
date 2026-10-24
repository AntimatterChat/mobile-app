// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useIntl} from 'react-intl';

import {useTheme} from '@context/theme';
import {getHeaderOptions, useNavigationHeader} from '@hooks/navigation_header';
import {usePropsFromParams} from '@hooks/props_from_params';
import CommunityProfileScreen from '@screens/community_profile';

type CommunityProfileRouteProps = {
    teamId: string;
    communityName?: string;
}

export default function CommunityProfileRoute() {
    const intl = useIntl();
    const theme = useTheme();
    const {teamId, communityName} = usePropsFromParams<CommunityProfileRouteProps>();

    useNavigationHeader({
        showWhenPushed: true,
        headerOptions: {
            headerTitle: intl.formatMessage({id: 'community_profile.header_title', defaultMessage: 'Your profile in {communityName}'}, {communityName: communityName || ''}),
            ...getHeaderOptions(theme),
        },
    });

    return (<CommunityProfileScreen teamId={teamId}/>);
}
