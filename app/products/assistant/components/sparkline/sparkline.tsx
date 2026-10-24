// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useMemo} from 'react';
import {View} from 'react-native';
import Svg, {Polyline} from 'react-native-svg';

import {ASSISTANT_MIN_SPARKLINE_POINTS} from '@assistant/constants';
import {useTheme} from '@context/theme';

type Props = {
    data: number[];
    width?: number;
    height?: number;
    testID?: string;
};

// Sparkline draws an insight card's own small trend line with the app's existing SVG
// library (react-native-svg), used only when the card's result carries enough points to
// be worth plotting.
const Sparkline = ({data, width = 120, height = 32, testID}: Props) => {
    const theme = useTheme();

    const points = useMemo(() => {
        if (!data || data.length < ASSISTANT_MIN_SPARKLINE_POINTS) {
            return undefined;
        }

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = (max - min) || 1;
        const stepX = data.length > 1 ? width / (data.length - 1) : 0;

        return data.
            map((value, index) => {
                const x = index * stepX;
                const y = height - (((value - min) / range) * height);
                return `${x},${y}`;
            }).
            join(' ');
    }, [data, width, height]);

    if (!points) {
        return null;
    }

    return (
        <View testID={testID}>
            <Svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                accessible={false}
            >
                <Polyline
                    points={points}
                    fill='none'
                    stroke={theme.linkColor}
                    strokeWidth={2}
                    strokeLinejoin='round'
                    strokeLinecap='round'
                />
            </Svg>
        </View>
    );
};

export default Sparkline;
