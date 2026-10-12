// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Text, View} from 'react-native';

import {useTheme} from '@context/theme';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import type {CommunityGroup} from '@utils/community_groups';

type Props = {
    roles: CommunityGroup[];
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 24,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
        maxWidth: '100%',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    label: {
        flexShrink: 1,
        color: theme.centerChannelColor,
        ...typography('Body', 75, 'SemiBold'),
    },
}));

// RoleChips lists someone's roles in the community, highest first, each with its colour, as the web profile's role
// chips.
const RoleChips = ({roles}: Props) => {
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const muted = changeOpacity(theme.centerChannelColor, 0.32);

    return (
        <View
            style={styles.container}
            testID='user_profile.roles'
        >
            {roles.map((role) => (
                <View
                    key={role.id}
                    style={styles.chip}
                    testID={`user_profile.roles.${role.id}`}
                >
                    <View style={[styles.dot, {backgroundColor: role.color || muted}]}/>
                    <Text
                        style={styles.label}
                        numberOfLines={1}
                    >
                        {role.display_name}
                    </Text>
                </View>
            ))}
        </View>
    );
};

export default RoleChips;
