// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {usePropsFromParams} from '@hooks/props_from_params';
import FocusSummaryScreen, {type FocusSummaryProps} from '@screens/focus_summary';

function FocusSummaryRoute() {
    const props = usePropsFromParams<FocusSummaryProps>();

    return <FocusSummaryScreen {...props}/>;
}

export default FocusSummaryRoute;
