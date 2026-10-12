// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {Text} from 'react-native';

import {useTheme} from '@context/theme';
import {makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        title: {
            ...typography('Heading', 700, 'SemiBold'),
            color: theme.centerChannelColor,
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 8,
        },
    };
});

const messages = defineMessages({
    antimatter: {
        id: 'about.antimatter',
        defaultMessage: 'Antimatter',
    },
});

const Title = () => {
    const intl = useIntl();
    const theme = useTheme();
    const style = getStyleSheet(theme);

    return (
        <Text
            style={style.title}
            testID='about.title'
        >
            {intl.formatMessage(messages.antimatter)}
        </Text>
    );
};

export default Title;
