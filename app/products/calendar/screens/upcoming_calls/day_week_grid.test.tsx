// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent} from '@testing-library/react-native';
import React from 'react';
import {Dimensions} from 'react-native';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import {addDays, startOfDay, startOfWeek, weekDays} from '../../utils/grid';

import DayWeekGrid from './day_week_grid';

import type {MeetingOccurrence} from '../../types/calendar';

jest.mock('@actions/remote/permalink');
jest.mock('@calls/actions/calls');

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => 'https://appv1.mattermost.com'),
}));

const occurrence = (overrides: Partial<MeetingOccurrence>): MeetingOccurrence => ({
    meeting_id: 'm1',
    post_id: 'p1',
    channel_id: 'c1',
    channel_name: 'standup',
    channel_display_name: 'Standup',
    channel_type: 'O',
    organizer_id: 'u1',
    summary: 'Call',
    start: 0,
    end: 0,
    recurring: false,
    ...overrides,
});

describe('DayWeekGrid', () => {
    const today = startOfDay(new Date(2026, 9, 21)); // a Wednesday
    const pageWidth = Dimensions.get('window').width;

    it('tapping a Week day header opens that day', () => {
        const onOpenDay = jest.fn();
        const columnDates = weekDays(startOfWeek(today, 1));
        const {getByTestId} = renderWithIntlAndTheme(
            <DayWeekGrid
                mode='week'
                date={today}
                occurrences={[]}
                firstDayOfWeek={1}
                columnDates={columnDates}
                onDateChange={jest.fn()}
                onOpenDay={onOpenDay}
            />,
        );
        fireEvent.press(getByTestId(`calendar.grid.column_header.${columnDates[2].toISOString()}`));
        expect(onOpenDay).toHaveBeenCalledWith(columnDates[2]);
    });

    it('does not open a day from the Day screen\'s own header', () => {
        const onOpenDay = jest.fn();
        const {getByTestId} = renderWithIntlAndTheme(
            <DayWeekGrid
                mode='day'
                date={today}
                occurrences={[]}
                firstDayOfWeek={1}
                columnDates={[today]}
                onDateChange={jest.fn()}
                onOpenDay={onOpenDay}
            />,
        );
        fireEvent.press(getByTestId(`calendar.grid.column_header.${today.toISOString()}`));
        expect(onOpenDay).not.toHaveBeenCalled();
    });

    it('swiping forward advances by one day in Day mode', () => {
        const onDateChange = jest.fn();
        const {getByTestId} = renderWithIntlAndTheme(
            <DayWeekGrid
                mode='day'
                date={today}
                occurrences={[]}
                firstDayOfWeek={1}
                columnDates={[today]}
                onDateChange={onDateChange}
                onOpenDay={jest.fn()}
            />,
        );
        fireEvent(getByTestId('calendar.grid.pager'), 'onMomentumScrollEnd', {
            nativeEvent: {contentOffset: {x: pageWidth * 2}},
        });
        expect(onDateChange).toHaveBeenCalledWith(addDays(today, 1));
    });

    it('swiping backward advances by one week in Week mode', () => {
        const onDateChange = jest.fn();
        const columnDates = weekDays(startOfWeek(today, 1));
        const {getByTestId} = renderWithIntlAndTheme(
            <DayWeekGrid
                mode='week'
                date={today}
                occurrences={[]}
                firstDayOfWeek={1}
                columnDates={columnDates}
                onDateChange={onDateChange}
                onOpenDay={jest.fn()}
            />,
        );
        fireEvent(getByTestId('calendar.grid.pager'), 'onMomentumScrollEnd', {
            nativeEvent: {contentOffset: {x: 0}},
        });
        expect(onDateChange).toHaveBeenCalledWith(addDays(today, -7));
    });

    it('lays out overlapping occurrences as separate blocks', () => {
        const a = occurrence({meeting_id: 'a', start: today.getTime() + (9 * 3600000), end: today.getTime() + (10 * 3600000)});
        const b = occurrence({meeting_id: 'b', start: today.getTime() + (9.5 * 3600000), end: today.getTime() + (10.5 * 3600000)});
        const {getByTestId} = renderWithIntlAndTheme(
            <DayWeekGrid
                mode='day'
                date={today}
                occurrences={[a, b]}
                firstDayOfWeek={1}
                columnDates={[today]}
                onDateChange={jest.fn()}
                onOpenDay={jest.fn()}
            />,
        );
        expect(getByTestId(`calendar.grid.block.${a.meeting_id}-${a.start}`)).toBeTruthy();
        expect(getByTestId(`calendar.grid.block.${b.meeting_id}-${b.start}`)).toBeTruthy();
    });

    it('draws the now-line only on today\'s column', () => {
        const now = today.getTime() + (3 * 3600000);
        jest.spyOn(Date, 'now').mockReturnValue(now);
        const columnDates = [today, addDays(today, 1)];
        const {getAllByTestId} = renderWithIntlAndTheme(
            <DayWeekGrid
                mode='week'
                date={today}
                occurrences={[]}
                firstDayOfWeek={1}
                columnDates={columnDates}
                onDateChange={jest.fn()}
                onOpenDay={jest.fn()}
            />,
        );
        expect(getAllByTestId('calendar.grid.now_line')).toHaveLength(1);
        jest.spyOn(Date, 'now').mockRestore();
    });
});
