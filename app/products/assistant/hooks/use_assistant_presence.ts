// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {setAssistantPresence} from '@assistant/actions/remote/feed';
import {ASSISTANT_DEFAULT_HEARTBEAT_SECONDS} from '@assistant/constants';
import {useIsFocused} from '@react-navigation/native';
import {useEffect, useRef, useState} from 'react';

// useAssistantPresence is the screen's own "I'm looking at this channel" signal
// (ASSISTANT_API.md): POST /presence with open:true when it's shown, again every
// heartbeat_seconds while it stays open (30s until the server answers with its own
// value), and once more with open:false on close, on a channel change, or when the
// screen loses focus (it can stay mounted further down the stack, e.g. behind "Go to
// message"): the heartbeat interval is always cleared on the same paths, so it never
// outlives the screen being shown.
export function useAssistantPresence(serverUrl: string, channelId: string | undefined) {
    const [following, setFollowing] = useState(false);
    const isFocused = useIsFocused();
    const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    useEffect(() => {
        if (!channelId || !isFocused) {
            return undefined;
        }

        let cancelled = false;

        const clearHeartbeat = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = undefined;
            }
        };

        const open = async () => {
            const result = await setAssistantPresence(serverUrl, channelId, true);
            if (cancelled) {
                return;
            }
            const heartbeatSeconds = result.data?.heartbeat_seconds || ASSISTANT_DEFAULT_HEARTBEAT_SECONDS;
            setFollowing(Boolean(result.data?.following));

            clearHeartbeat();
            intervalRef.current = setInterval(() => {
                setAssistantPresence(serverUrl, channelId, true).then((heartbeatResult) => {
                    if (!cancelled) {
                        setFollowing(Boolean(heartbeatResult.data?.following));
                    }
                });
            }, heartbeatSeconds * 1000);
        };

        open();

        return () => {
            cancelled = true;
            clearHeartbeat();
            setAssistantPresence(serverUrl, channelId, false);
        };
    }, [serverUrl, channelId, isFocused]);

    return {following};
}
