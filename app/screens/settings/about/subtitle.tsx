// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {defineMessages} from 'react-intl';

import FormattedText from '@components/formatted_text';
import {useTheme} from '@context/theme';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        subtitle: {
            color: changeOpacity(theme.centerChannelColor, 0.72),
            ...typography('Heading', 400, 'Regular'),
            textAlign: 'center',
            paddingHorizontal: 24,
        },
    };
});

const messages = defineMessages({
    subtitle: {
        id: 'about.subtitle',
        defaultMessage: 'Your team\'s chat, calls and apps, on your own server.',
    },
});

const Subtitle = () => {
    const theme = useTheme();
    const style = getStyleSheet(theme);

    return (
        <FormattedText
            {...messages.subtitle}
            style={style.subtitle}
            testID='about.subtitle'
        />
    );
};

export default Subtitle;
