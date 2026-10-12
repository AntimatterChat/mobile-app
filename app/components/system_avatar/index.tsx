// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import tinycolor from 'tinycolor2';

import AntimatterLogo from '@components/antimatter_logo';
import {View as ViewConstants} from '@constants';

type Props = {
    theme: Theme;
}

const SystemAvatar = ({theme}: Props) => {
    return (
        <AntimatterLogo
            size={ViewConstants.PROFILE_PICTURE_SIZE}
            variant={tinycolor(theme.centerChannelBg).isDark() ? 'dark' : 'light'}
        />
    );
};

export default SystemAvatar;
