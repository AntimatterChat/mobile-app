// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Validates the edit form's fields against the same limits the Calendar app's server
// enforces (.meetings_api_ref.md: "summary is required (at most 1000 characters;
// description 4000); the call lasts 1 minute to 24 hours"), so the form catches a bad
// value before the request round-trips.

export const SUMMARY_MAX_LENGTH = 1000;
export const DESCRIPTION_MAX_LENGTH = 4000;
export const MIN_DURATION_MS = 60 * 1000;
export const MAX_DURATION_MS = 24 * 60 * 60 * 1000;

export type MeetingFormError =
    | 'need_summary'
    | 'summary_too_long'
    | 'description_too_long'
    | 'end_before_start'
    | 'too_short'
    | 'too_long';

export function validateMeetingForm(summary: string, description: string, start: number, end: number): MeetingFormError | undefined {
    if (!summary.trim()) {
        return 'need_summary';
    }
    if (summary.length > SUMMARY_MAX_LENGTH) {
        return 'summary_too_long';
    }
    if (description.length > DESCRIPTION_MAX_LENGTH) {
        return 'description_too_long';
    }
    if (end <= start) {
        return 'end_before_start';
    }
    const duration = end - start;
    if (duration < MIN_DURATION_MS) {
        return 'too_short';
    }
    if (duration > MAX_DURATION_MS) {
        return 'too_long';
    }
    return undefined;
}
