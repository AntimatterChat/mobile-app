// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {usePropsFromParams} from '@hooks/props_from_params';
import BurnDurationPickerScreen, {type BurnDurationPickerProps} from '@screens/burn_duration_picker';

function BurnDurationPickerRoute() {
    const props = usePropsFromParams<BurnDurationPickerProps>();

    return <BurnDurationPickerScreen {...props}/>;
}

export default BurnDurationPickerRoute;
