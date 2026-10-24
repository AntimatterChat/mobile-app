// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {IntlShape} from 'react-intl';

// How many sign-in warnings are shown at once; the others wait their turn (a count says how many), so that a burst
// of sign-ins can't cover the screen.
export const MAX_SHOWN_SIGN_INS = 3;

// describeDevice names the device that signed in: the app or browser, and the system it runs on.
export function describeDevice(intl: IntlShape, signIn: SignIn): string {
    const name = (signIn.browser || '').split('/')[0].trim();
    let app = name === 'Unknown' ? '' : name;
    if (signIn.mobile || name === 'Mobile App') {
        app = intl.formatMessage({id: 'sign_in_warning.mobile_app', defaultMessage: 'Mobile app'});
    } else if (name === 'Desktop App') {
        app = intl.formatMessage({id: 'sign_in_warning.desktop_app', defaultMessage: 'Desktop app'});
    }
    const system = signIn.os || (signIn.platform === 'Unknown' ? '' : signIn.platform);
    if (app && system) {
        return intl.formatMessage({id: 'sign_in_warning.device', defaultMessage: '{app} on {system}'}, {app, system});
    }
    return app || system || intl.formatMessage({id: 'sign_in_warning.unknown_device', defaultMessage: 'Unknown device'});
}
