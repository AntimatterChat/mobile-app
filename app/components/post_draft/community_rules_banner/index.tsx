// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Button} from '@rneui/base';
import React, {useCallback} from 'react';
import {defineMessages} from 'react-intl';
import {type Edge, SafeAreaView} from 'react-native-safe-area-context';

import FormattedText from '@components/formatted_text';
import {Screens} from '@constants';
import {useTheme} from '@context/theme';
import {navigateToScreen} from '@screens/navigation';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

const getStyleSheet = makeStyleSheetFromTheme((theme) => ({
    wrapper: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderTopWidth: 1,
        backgroundColor: theme.centerChannelBg,
        borderTopColor: changeOpacity(theme.centerChannelColor, 0.20),
    },
    text: {
        textAlign: 'center',
        color: theme.centerChannelColor,
    },
    button: {
        backgroundColor: theme.buttonBg,
        alignItems: 'center',
        paddingVertical: 5,
        borderRadius: 4,
        marginTop: 10,
        height: 40,
    },
    buttonText: {
        marginTop: 1,
        color: 'white',
        fontWeight: 'bold',
    },
}));

const edges: Edge[] = ['bottom'];

const messages = defineMessages({
    notice: {
        id: 'community_rules.composer_notice',
        defaultMessage: 'Agree to the rules to post here',
    },
    readAndAgree: {
        id: 'community_rules.read_and_agree',
        defaultMessage: 'Read and agree',
    },
});

type Props = {
    testID?: string;
    teamId: string;
}

export default function CommunityRulesBanner({testID, teamId}: Props) {
    const theme = useTheme();
    const style = getStyleSheet(theme);

    const onPress = useCallback(() => {
        navigateToScreen(Screens.COMMUNITY_RULES, {teamId});
    }, [teamId]);

    return (
        <SafeAreaView
            edges={edges}
            testID={testID}
            style={style.wrapper}
        >
            <FormattedText
                {...messages.notice}
                style={style.text}
            />
            <Button
                buttonStyle={style.button}
                onPress={onPress}
                testID={`${testID}.read_and_agree.button`}
            >
                <FormattedText
                    {...messages.readAndAgree}
                    style={style.buttonText}
                />
            </Button>
        </SafeAreaView>
    );
}
