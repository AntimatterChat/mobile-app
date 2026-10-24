// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useDatabase} from '@nozbe/watermelondb/react';
import React, {useCallback, useEffect, useState} from 'react';

import {acknowledgeOwnSession, revokeOwnSession} from '@actions/remote/session';
import {useServerUrl} from '@context/server';
import {getCurrentUserId} from '@queries/servers/system';
import SignInStore from '@store/sign_in_store';

import SignInWarning from './sign_in_warning';

function SignInWarningContainer() {
    const serverUrl = useServerUrl();
    const database = useDatabase();
    const [signIns, setSignIns] = useState<SignIn[]>(() => SignInStore.getState(serverUrl));

    useEffect(() => {
        const subscription = SignInStore.observe(serverUrl).subscribe(setSignIns);
        return () => subscription.unsubscribe();
    }, [serverUrl]);

    const onItsMe = useCallback(async (sessionId: string) => {
        SignInStore.remove(serverUrl, sessionId);
        if (!database) {
            return;
        }
        const userId = await getCurrentUserId(database);
        if (userId) {
            acknowledgeOwnSession(serverUrl, userId, sessionId);
        }
    }, [serverUrl, database]);

    const onDisconnect = useCallback(async (sessionId: string) => {
        if (!database) {
            return false;
        }
        const userId = await getCurrentUserId(database);
        if (!userId) {
            return false;
        }
        const {error} = await revokeOwnSession(serverUrl, userId, sessionId);
        if (error) {
            return false;
        }
        SignInStore.remove(serverUrl, sessionId);
        return true;
    }, [serverUrl, database]);

    return (
        <SignInWarning
            signIns={signIns}
            onItsMe={onItsMe}
            onDisconnect={onDisconnect}
        />
    );
}

export default SignInWarningContainer;
