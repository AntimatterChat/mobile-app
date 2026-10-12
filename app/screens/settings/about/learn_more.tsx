// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {defineMessages} from 'react-intl';
import {Text, View} from 'react-native';

import Config from '@assets/config.json';
import FormattedText from '@components/formatted_text';
import {useTheme} from '@context/theme';
import {makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        learnContainer: {
            flex: 1,
            flexDirection: 'column',
            marginTop: 20,
        },
        learn: {
            color: theme.centerChannelColor,
            ...typography('Body', 200, 'Regular'),
        },
        learnLink: {
            color: theme.linkColor,
            ...typography('Body', 200, 'Regular'),
        },
    };
});

type LearnMoreProps = {
    onPress: () => void;
};

const messages = defineMessages({
    learnMore: {
        id: 'about.learnMore',
        defaultMessage: 'Learn more about Antimatter at ',
    },
});

const LearnMore = ({onPress}: LearnMoreProps) => {
    const theme = useTheme();
    const style = getStyleSheet(theme);
    const url = Config.WebsiteURL;

    return (
        <View style={style.learnContainer}>
            <Text style={style.learn}>
                <FormattedText
                    {...messages.learnMore}
                    testID='about.learn_more.text'
                />
                <Text
                    accessibilityRole='link'
                    style={style.learnLink}
                    onPress={onPress}
                    testID='about.learn_more.url'
                >
                    {url}
                </Text>
            </Text>
        </View>
    );
};

export default LearnMore;
