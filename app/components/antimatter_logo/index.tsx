// Copyright (c) 2026-present Antimatter contributors. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect} from 'react';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, {Circle, Ellipse, Path} from 'react-native-svg';
import tinycolor from 'tinycolor2';

import {useTheme} from '@context/theme';

type Props = {

    /** Width and height of the mark, in points. */
    size?: number;

    /** Spins the orbits and makes the star pulse, unless the system asks to reduce motion. */
    animated?: boolean;

    /** Colours for a light or a dark background; follows the theme when not given. */
    variant?: 'light' | 'dark';
    style?: StyleProp<ViewStyle>;
    testID?: string;
}

// The mark of antimatter.chat, on a 64x64 grid. The colours are those of the site: matter violet, anti cyan
// and spark amber, in a deeper shade on light backgrounds.
const COLORS = {
    light: {matter: '#6D28D9', anti: '#0891B2', spark: '#F59E0B', hollow: '#FFFFFF'},
    dark: {matter: '#A78BFA', anti: '#22D3EE', spark: '#FBBF24', hollow: '#1B1A24'},
};

const STAR = 'M32 20.5Q33.9 30.1 43.5 32Q33.9 33.9 32 43.5Q30.1 33.9 20.5 32Q30.1 30.1 32 20.5Z';
const ORBIT_PERIOD = 2400;
const PULSE_PERIOD = 1200;

const styles = StyleSheet.create({
    layer: {
        ...StyleSheet.absoluteFillObject,
    },
});

export const ANTIMATTER_MARK_COLORS = COLORS;

const AntimatterLogo = ({size = 96, animated = false, variant, style, testID}: Props) => {
    const theme = useTheme();
    const reducedMotion = useReducedMotion();
    const colors = COLORS[variant ?? (tinycolor(theme.centerChannelBg).isDark() ? 'dark' : 'light')];
    const shouldAnimate = animated && !reducedMotion;

    const turn = useSharedValue(0);
    const pulse = useSharedValue(1);

    useEffect(() => {
        if (!shouldAnimate) {
            turn.value = 0;
            pulse.value = 1;
            return undefined;
        }

        turn.value = withRepeat(withTiming(1, {duration: ORBIT_PERIOD, easing: Easing.linear}), -1, false);
        pulse.value = withRepeat(
            withSequence(
                withTiming(0.8, {duration: PULSE_PERIOD / 2, easing: Easing.inOut(Easing.quad)}),
                withTiming(1, {duration: PULSE_PERIOD / 2, easing: Easing.inOut(Easing.quad)}),
            ),
            -1,
            false,
        );

        return () => {
            cancelAnimation(turn);
            cancelAnimation(pulse);
        };
    }, [shouldAnimate, turn, pulse]);

    // The two orbits turn in opposite directions, each carrying its particle.
    const matterStyle = useAnimatedStyle(() => ({
        transform: [{rotate: `${turn.value * 360}deg`}],
    }));
    const antiStyle = useAnimatedStyle(() => ({
        transform: [{rotate: `${-turn.value * 360}deg`}],
    }));
    const sparkStyle = useAnimatedStyle(() => ({
        transform: [{scale: pulse.value}],
    }));

    return (
        <View
            style={[{width: size, height: size}, style]}
            testID={testID}
            accessibilityRole='image'
            accessibilityLabel='Antimatter'
        >
            <Animated.View style={[styles.layer, matterStyle]}>
                <Svg
                    width={size}
                    height={size}
                    viewBox='0 0 64 64'
                >
                    <Ellipse
                        cx={32}
                        cy={32}
                        rx={25}
                        ry={9.5}
                        fill='none'
                        stroke={colors.matter}
                        strokeWidth={4.5}
                        transform='rotate(45 32 32)'
                    />
                    <Circle
                        cx={14.32}
                        cy={14.32}
                        r={5.5}
                        fill={colors.matter}
                    />
                </Svg>
            </Animated.View>
            <Animated.View style={[styles.layer, antiStyle]}>
                <Svg
                    width={size}
                    height={size}
                    viewBox='0 0 64 64'
                >
                    <Ellipse
                        cx={32}
                        cy={32}
                        rx={25}
                        ry={9.5}
                        fill='none'
                        stroke={colors.anti}
                        strokeWidth={4.5}
                        transform='rotate(-45 32 32)'
                    />
                    <Circle
                        cx={49.68}
                        cy={14.32}
                        r={4.25}
                        fill={colors.hollow}
                        stroke={colors.anti}
                        strokeWidth={2.5}
                    />
                </Svg>
            </Animated.View>
            <Animated.View style={[styles.layer, sparkStyle]}>
                <Svg
                    width={size}
                    height={size}
                    viewBox='0 0 64 64'
                >
                    <Path
                        d={STAR}
                        fill={colors.spark}
                    />
                </Svg>
            </Animated.View>
        </View>
    );
};

export default AntimatterLogo;
