// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {type StyleProp, StyleSheet, type TextStyle, View} from 'react-native';

import CompassIcon from '@components/compass_icon';

type Props = {

    // Crossed out: the person stopped hearing the call.
    deafened: boolean;
    size: number;
    color: string;
    style?: StyleProp<TextStyle>;
    testID?: string;
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    slash: {
        position: 'absolute',
        transform: [{rotate: '-45deg'}],
        borderRadius: 1,
    },
});

// HeadphonesIcon is the headphones of the deafen control: crossed out when deafened, as the font has no such icon.
const HeadphonesIcon = ({deafened, size, color, style, testID}: Props) => {
    return (
        <View
            style={styles.container}
            testID={testID}
        >
            <CompassIcon
                name='headphones'
                size={size}
                color={color}
                style={style}
            />
            {deafened && (
                <View
                    style={[styles.slash, {width: size * 1.1, height: Math.max(2, size / 10), backgroundColor: color}]}
                    testID={testID ? `${testID}.slash` : undefined}
                />
            )}
        </View>
    );
};

export default HeadphonesIcon;
