// Copyright (c) 2026-present Antimatter contributors. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {StyleSheet, useColorScheme, useWindowDimensions, View} from 'react-native';
import Svg, {Defs, RadialGradient, Rect, Stop} from 'react-native-svg';

import AntimatterLogo from '.';

// Same colours and layout as the native launch screen (scripts/generate-brand-assets.py), so that the
// animated mark takes over from the static one without a jump.
const BACKGROUND = {light: '#FFFFFF', dark: '#1B1A24'};
const GLOW = {light: '#EDE9FE', dark: '#2A1F5C'};

// The launch screen shows the mark cropped to its 60x60 extent in 96pt; the logo draws the full 64x64 grid.
const LOGO_SIZE = (96 * 64) / 60;

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
    },
});

const LaunchLoader = () => {
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const {width, height} = useWindowDimensions();
    const side = Math.max(width, height);

    return (
        <View
            style={[styles.container, {backgroundColor: BACKGROUND[scheme]}]}
            testID='launch_loader'
        >
            <Svg
                width={side}
                height={side}
                viewBox='0 0 100 100'
                style={[styles.glow, {left: (width - side) / 2, top: (height - side) / 2}]}
            >
                <Defs>
                    <RadialGradient
                        id='launch_glow'
                        cx='50'
                        cy='50'
                        r='50'
                        gradientUnits='userSpaceOnUse'
                    >
                        <Stop
                            offset='0'
                            stopColor={GLOW[scheme]}
                            stopOpacity='1'
                        />
                        <Stop
                            offset='1'
                            stopColor={GLOW[scheme]}
                            stopOpacity='0'
                        />
                    </RadialGradient>
                </Defs>
                <Rect
                    width='100'
                    height='100'
                    fill='url(#launch_glow)'
                />
            </Svg>
            <AntimatterLogo
                size={LOGO_SIZE}
                animated={true}
                variant={scheme}
            />
        </View>
    );
};

export default LaunchLoader;
