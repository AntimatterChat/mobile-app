// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {DESCRIPTION_MAX_LENGTH, SUMMARY_MAX_LENGTH, validateMeetingForm} from './validation';

const HOUR = 60 * 60 * 1000;

describe('validateMeetingForm', () => {
    it('passes a valid call', () => {
        expect(validateMeetingForm('Sync', 'Agenda', 0, HOUR)).toBeUndefined();
    });

    it('requires a non-blank summary', () => {
        expect(validateMeetingForm('', 'd', 0, HOUR)).toBe('need_summary');
        expect(validateMeetingForm('   ', 'd', 0, HOUR)).toBe('need_summary');
    });

    it('caps the summary length', () => {
        expect(validateMeetingForm('a'.repeat(SUMMARY_MAX_LENGTH + 1), '', 0, HOUR)).toBe('summary_too_long');
        expect(validateMeetingForm('a'.repeat(SUMMARY_MAX_LENGTH), '', 0, HOUR)).toBeUndefined();
    });

    it('caps the description length', () => {
        expect(validateMeetingForm('Sync', 'd'.repeat(DESCRIPTION_MAX_LENGTH + 1), 0, HOUR)).toBe('description_too_long');
    });

    it('requires the end after the start', () => {
        expect(validateMeetingForm('Sync', '', HOUR, 0)).toBe('end_before_start');
        expect(validateMeetingForm('Sync', '', HOUR, HOUR)).toBe('end_before_start');
    });

    it('requires at least a minute', () => {
        expect(validateMeetingForm('Sync', '', 0, 30 * 1000)).toBe('too_short');
        expect(validateMeetingForm('Sync', '', 0, 60 * 1000)).toBeUndefined();
    });

    it('caps the duration at 24 hours', () => {
        expect(validateMeetingForm('Sync', '', 0, (25 * HOUR))).toBe('too_long');
        expect(validateMeetingForm('Sync', '', 0, (24 * HOUR))).toBeUndefined();
    });
});
