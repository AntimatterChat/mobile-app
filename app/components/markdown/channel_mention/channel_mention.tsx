// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {type ReactNode, useCallback, useMemo} from 'react';
import {defineMessage, useIntl} from 'react-intl';
import {type StyleProp, Text, type TextStyle} from 'react-native';

import {joinChannel, switchToChannelById} from '@actions/remote/channel';
import {useServerUrl} from '@context/server';
import {usePreventDoubleTap} from '@hooks/utils';
import {alertErrorWithFallback} from '@utils/draft';
import {secureGetFromRecord, isRecordOf} from '@utils/types';

import type {ChannelLinkSigil} from '../channel_links';
import type ChannelModel from '@typings/database/models/servers/channel';
import type TeamModel from '@typings/database/models/servers/team';

export type ChannelMentions = Record<string, {id?: string; display_name: string; name?: string; team_name?: string}>;

export function isChannelMentions(v: unknown): v is ChannelMentions {
    return isRecordOf(v, (e) => {
        if (typeof e !== 'object' || !e) {
            return false;
        }

        if (!('display_name' in e) || typeof e.display_name !== 'string') {
            return false;
        }

        if ('team_name' in e && typeof e.team_name !== 'string') {
            return false;
        }

        if ('id' in e && typeof e.id !== 'string') {
            return false;
        }

        if ('name' in e && typeof e.name !== 'string') {
            return false;
        }

        return true;
    });
}

type ChannelMentionProps = {
    channelMentions?: ChannelMentions;
    channelName: string;
    channels: ChannelModel[];
    currentTeamId: string;
    linkStyle: StyleProp<TextStyle>;
    team: TeamModel;
    textStyle: StyleProp<TextStyle>;

    // The sign the link was written with: Antimatter's #channel-name or Mattermost's ~channel-name.
    sigil?: ChannelLinkSigil;

    // What to show when no channel has this name (a #name's hashtag), instead of the link as written.
    unresolved?: ReactNode;
}

// getChannelFromChannelName finds the channel a link names, among the channels the server resolved for the post and
// the community's, and the part of the name that matched: trailing - and _ may be punctuation.
export function getChannelFromChannelName(name: string, channels: ChannelModel[], channelMentions: ChannelMentions = {}, teamName: string) {
    const channelsByName: ChannelMentions = {...channelMentions};
    let channelName = name;

    channels.forEach((c) => {
        channelsByName[c.name] = {
            id: c.id,
            display_name: c.displayName,
            name: c.name,
            team_name: teamName,
        };
    });

    while (channelName.length > 0) {
        // Channel names are lower case; #Release names the release channel.
        for (const candidate of [channelName, channelName.toLowerCase()]) {
            const channel = secureGetFromRecord(channelsByName, candidate);
            if (channel) {
                return {channel, matched: channelName};
            }
        }

        // Repeatedly trim off trailing punctuation in case this is at the end of a sentence
        if ((/[_-]$/).test(channelName)) {
            channelName = channelName.substring(0, channelName.length - 1);
        } else {
            break;
        }
    }

    return null;
}

// ChannelMention shows a channel link as Antimatter does, #Channel Name, whether it was written #channel-name or
// ~channel-name.
const ChannelMention = ({
    channelMentions, channelName, channels, currentTeamId,
    linkStyle, team, textStyle, sigil = '~', unresolved,
}: ChannelMentionProps) => {
    const intl = useIntl();
    const serverUrl = useServerUrl();
    const found = useMemo(
        () => getChannelFromChannelName(channelName, channels, channelMentions, team.name),
        [channelMentions, channelName, channels, team.name],
    );
    const channel = found?.channel;
    const matchedName = found?.matched ?? channelName;

    const handlePress = usePreventDoubleTap(useCallback((async () => {
        let c = channel;

        if (!c?.id && c?.display_name) {
            const result = await joinChannel(serverUrl, currentTeamId, undefined, channel?.name ?? matchedName.toLowerCase());
            if (result.error || !result.channel) {
                const joinFailedMessage = defineMessage({
                    id: 'mobile.join_channel.error',
                    defaultMessage: "We couldn't join the channel {displayName}.",
                });
                alertErrorWithFallback(intl, result.error || {}, joinFailedMessage, {displayName: c.display_name});
            } else if (result.channel) {
                c = {
                    ...c,
                    id: result.channel.id,
                    name: result.channel.name,
                };
            }
        }

        if (c?.id) {
            switchToChannelById(serverUrl, c.id);
        }
    }), [channel, matchedName, currentTeamId, intl, serverUrl]));

    if (!channel) {
        if (unresolved !== undefined) {
            return <>{unresolved}</>;
        }
        return <Text style={textStyle}>{`${sigil}${channelName}`}</Text>;
    }

    const suffix = channelName.substring(matchedName.length) || undefined;

    return (
        <Text style={textStyle}>
            <Text
                onPress={handlePress}
                style={linkStyle}
            >
                {`#${channel.display_name}`}
            </Text>
            {suffix}
        </Text>
    );
};

export default ChannelMention;
