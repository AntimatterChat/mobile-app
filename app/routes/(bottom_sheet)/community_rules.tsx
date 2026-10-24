// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useNavigation} from 'expo-router';
import {useEffect} from 'react';

import {usePropsFromParams} from '@hooks/props_from_params';
import CommunityRulesScreen from '@screens/community_rules';

type CommunityRulesRouteProps = {
    teamId: string;
}

export default function CommunityRulesRoute() {
    const navigation = useNavigation();
    const {teamId} = usePropsFromParams<CommunityRulesRouteProps>();

    useEffect(() => {
        navigation.setOptions({
            animation: 'none',
            presentation: 'transparentModal',
            contentStyle: {backgroundColor: 'transparent'},
            headerShown: false,
            gestureEnabled: false,
        });
    }, [navigation]);

    return <CommunityRulesScreen teamId={teamId}/>;
}
