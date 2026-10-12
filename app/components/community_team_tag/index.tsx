// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {Pressable, Text} from 'react-native';

import {useTheme} from '@context/theme';
import {usePreventDoubleTap} from '@hooks/utils';
import {openCommunityTeam} from '@screens/community_team';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import type {CommunityGroup} from '@utils/community_groups';

type Props = {
    team: CommunityGroup;
    testID?: string;
}

const hitSlop = {top: 8, bottom: 8, left: 4, right: 4};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    tag: {
        height: 16,
        paddingHorizontal: 5,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.16),
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.04),
        justifyContent: 'center',
    },
    pressed: {
        borderColor: changeOpacity(theme.centerChannelColor, 0.48),
    },
    text: {
        color: changeOpacity(theme.centerChannelColor, 0.72),
        letterSpacing: 0.5,
        ...typography('Body', 25, 'SemiBold'),
        lineHeight: 14,
    },
}));

// CommunityTeamTag is the short tag of the team someone shows next to their name, as a server tag; it opens the
// team's card.
const CommunityTeamTag = ({team, testID = 'community_team_tag'}: Props) => {
    const theme = useTheme();
    const styles = getStyleSheet(theme);

    const onPress = usePreventDoubleTap(useCallback(() => {
        openCommunityTeam(team);
    }, [team]));

    return (
        <Pressable
            onPress={onPress}
            hitSlop={hitSlop}
            style={({pressed}) => [styles.tag, pressed && styles.pressed]}
            accessibilityRole='button'
            accessibilityLabel={team.display_name}
            testID={testID}
        >
            <Text
                style={styles.text}
                numberOfLines={1}
            >
                {team.tag}
            </Text>
        </Pressable>
    );
};

export default CommunityTeamTag;
