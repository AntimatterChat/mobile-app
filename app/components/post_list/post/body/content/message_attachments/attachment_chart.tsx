// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useMemo} from 'react';
import {View} from 'react-native';
import Svg, {Circle, Line, Polygon, Polyline} from 'react-native-svg';

import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

const VALUES_MAX = 60;
const HEIGHT = 72;
const PAD = 8;
const DEFAULT_WIDTH = 280;

const getStyleSheet = makeStyleSheetFromTheme(() => ({
    container: {
        marginTop: 8,
    },
}));

// sparkline gives the points of a chart drawn in a w×h box: its line, the area under it, and
// where the threshold sits. The scale includes the threshold, with a margin, and starts at 0
// for values that never go below it. Mirrors Fusion's own sparkline (webapp/fusion/src/
// fusion/messages/content/cards.tsx) so a chart looks the same on mobile and on the web.
export function sparkline(values: number[], threshold: number | undefined, w: number, h: number) {
    const all = threshold === undefined ? values : [...values, threshold];
    const hi = Math.max(...all);
    const lo = Math.min(...all);
    const pad = ((hi - lo) * 0.15) || 1;
    const max = hi + pad;
    const min = lo >= 0 ? Math.max(0, lo - pad) : lo - pad;
    const x = (i: number) => ((i / (values.length - 1)) * (w - (PAD * 2))) + PAD;
    const y = (v: number) => h - PAD - (((v - min) / (max - min)) * (h - (PAD * 2)));
    const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    return {
        points,
        area: `${PAD},${h - PAD} ${points} ${x(values.length - 1).toFixed(1)},${h - PAD}`,
        last: {x: x(values.length - 1), y: y(values[values.length - 1])},
        threshold: threshold === undefined ? undefined : y(threshold),
    };
}

type Props = {
    chart: MessageAttachmentChart;
    color: string;
    layoutWidth?: number;
    theme: Theme;
};

// AttachmentChart draws a message attachment's `chart` field: a sparkline of recent values in
// the attachment's own colour, with the threshold (if any) as a dashed line, using the app's
// existing SVG library (react-native-svg), no charting library. ASSISTANT_DISPLAY.md.
const AttachmentChart = ({chart, color, layoutWidth, theme}: Props) => {
    const styles = getStyleSheet(theme);
    const width = Math.max(160, (layoutWidth ?? DEFAULT_WIDTH) - 24);

    const values = useMemo(() => (
        Array.isArray(chart.values) ?
            chart.values.filter((v) => typeof v === 'number' && Number.isFinite(v)).slice(-VALUES_MAX) :
            []
    ), [chart.values]);

    const threshold = typeof chart.threshold === 'number' && Number.isFinite(chart.threshold) ? chart.threshold : undefined;

    const line = useMemo(
        () => (values.length >= 2 ? sparkline(values, threshold, width, HEIGHT) : null),
        [values, threshold, width],
    );

    if (!line) {
        return null;
    }

    const label = chart.label || undefined;

    return (
        <View
            style={styles.container}
            accessible={true}
            accessibilityRole='image'
            accessibilityLabel={label}
            testID='attachment_chart'
        >
            <Svg
                width={width}
                height={HEIGHT}
                viewBox={`0 0 ${width} ${HEIGHT}`}
            >
                <Polygon
                    points={line.area}
                    fill={color}
                    fillOpacity={0.14}
                />
                {line.threshold !== undefined && (
                    <Line
                        x1={PAD}
                        x2={width - PAD}
                        y1={line.threshold}
                        y2={line.threshold}
                        stroke={changeOpacity(theme.errorTextColor, 0.7)}
                        strokeWidth={1.5}
                        strokeDasharray='5 4'
                    />
                )}
                <Polyline
                    points={line.points}
                    fill='none'
                    stroke={color}
                    strokeWidth={2.2}
                    strokeLinejoin='round'
                    strokeLinecap='round'
                />
                <Circle
                    cx={line.last.x}
                    cy={line.last.y}
                    r={3.5}
                    fill={color}
                />
            </Svg>
        </View>
    );
};

export default AttachmentChart;
