// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withObservables} from '@nozbe/watermelondb/react';
import moment from 'moment-timezone';
import {of as of$} from 'rxjs';
import {distinctUntilChanged, switchMap} from 'rxjs/operators';

import {Preferences} from '@constants';
import {getDisplayNamePreferenceAsBool} from '@helpers/api/preference';
import {queryDisplayNamePreferences} from '@queries/servers/preference';
import {observeCurrentUser} from '@queries/servers/user';
import {getUserTimezone} from '@utils/user';

import type {WithDatabaseArgs} from '@typings/database/database';

// Fusion's display setting that turns walltimes off.
export const WALLTIME_PREFERENCE = 'walltime';

// withReaderTime gives the reader's time zone (the device's when they have none) and whether they read 24-hour times.
export const withReaderTime = withObservables([], ({database}: WithDatabaseArgs) => ({
    readerZone: observeCurrentUser(database).pipe(
        switchMap((user) => of$(getUserTimezone(user) || moment.tz.guess())),
        distinctUntilChanged(),
    ),
    isMilitaryTime: queryDisplayNamePreferences(database, Preferences.USE_MILITARY_TIME).observeWithColumns(['value']).pipe(
        switchMap((prefs) => of$(getDisplayNamePreferenceAsBool(prefs, Preferences.USE_MILITARY_TIME, false))),
        distinctUntilChanged(),
    ),
    walltimesEnabled: queryDisplayNamePreferences(database, WALLTIME_PREFERENCE).observeWithColumns(['value']).pipe(
        switchMap((prefs) => of$(prefs[0]?.value !== 'false')),
        distinctUntilChanged(),
    ),
}));
