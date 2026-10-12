// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useIntl} from 'react-intl';
import {Text, View} from 'react-native';

import {createDirectChannel, fetchChannelById, joinIfNeededAndSwitchToChannel, switchToChannelById} from '@actions/remote/channel';
import {fetchMissingProfilesByIds} from '@actions/remote/user';
import Button from '@components/button';
import CompassIcon, {type CompassIconName} from '@components/compass_icon';
import ProfilePicture from '@components/profile_picture';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {usePreventDoubleTap} from '@hooks/utils';
import {dismissBottomSheet} from '@screens/navigation';
import {logDebug} from '@utils/log';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';
import {displayUsername} from '@utils/user';

import type ChannelModel from '@typings/database/models/servers/channel';
import type UserModel from '@typings/database/models/servers/user';
import type {CommunityGroup} from '@utils/community_groups';

export const FACES = 10;

type Props = {
    team: CommunityGroup;
    lead?: UserModel;
    members: UserModel[];
    channel?: ChannelModel;
    isChannelMember: boolean;
    teammateNameDisplay: string;
}

type ChannelInfo = {id: string; displayName: string; teamId: string};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    head: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    bigTag: {
        minWidth: 46,
        height: 46,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.16),
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.04),
        alignItems: 'center',
        justifyContent: 'center',
    },
    bigTagText: {
        color: theme.centerChannelColor,
        letterSpacing: 0.5,
        ...typography('Heading', 200, 'SemiBold'),
    },
    titles: {
        flex: 1,
    },
    name: {
        color: theme.centerChannelColor,
        ...typography('Heading', 400, 'SemiBold'),
    },
    sub: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 100),
    },
    description: {
        color: changeOpacity(theme.centerChannelColor, 0.72),
        marginTop: 12,
        ...typography('Body', 200),
    },
    facts: {
        marginTop: 12,
        gap: 6,
    },
    fact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    factText: {
        flex: 1,
        color: changeOpacity(theme.centerChannelColor, 0.72),
        ...typography('Body', 100),
    },
    faces: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 12,
    },
    moreFaces: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        marginLeft: 4,
        ...typography('Body', 75, 'SemiBold'),
    },
    reach: {
        marginTop: 16,
    },
}));

const Fact = ({icon, text, theme}: {icon: CompassIconName; text: string; theme: Theme}) => {
    const styles = getStyleSheet(theme);
    return (
        <View style={styles.fact}>
            <CompassIcon
                name={icon}
                size={16}
                color={changeOpacity(theme.centerChannelColor, 0.56)}
            />
            <Text
                style={styles.factText}
                numberOfLines={1}
            >
                {text}
            </Text>
        </View>
    );
};

// CommunityTeam shows a team of a community, as the web app's team card: its tag and name, what it does, its lead,
// its channel and its members, and a way to reach it: its channel, else its lead.
const CommunityTeam = ({team, lead, members, channel, isChannelMember, teammateNameDisplay}: Props) => {
    const intl = useIntl();
    const {formatMessage} = intl;
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const serverUrl = useServerUrl();
    const memberIds = team.member_ids ?? [];

    // A team channel the app doesn't hold yet (one the person isn't in) is looked up: if they can't see it, they're
    // offered the lead instead.
    const [fetched, setFetched] = useState<ChannelInfo>();
    const teamChannel: ChannelInfo | undefined = useMemo(() => (
        channel ? {id: channel.id, displayName: channel.displayName, teamId: channel.teamId} : fetched
    ), [channel, fetched]);

    useEffect(() => {
        const ids = memberIds.slice(0, FACES);
        if (team.lead_id) {
            ids.push(team.lead_id);
        }
        fetchMissingProfilesByIds(serverUrl, ids);
        if (team.channel_id && !channel) {
            fetchChannelById(serverUrl, team.channel_id).then(({channel: c}) => {
                if (c && !c.delete_at) {
                    setFetched({id: c.id, displayName: c.display_name, teamId: c.team_id});
                }
            });
        }

        // Once per team: the members and channel are looked up when the card opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [team.id]);

    const leadName = lead ? displayUsername(lead, intl.locale, teammateNameDisplay) : '';

    const go = usePreventDoubleTap(useCallback(async () => {
        await dismissBottomSheet();
        if (teamChannel) {
            if (isChannelMember) {
                switchToChannelById(serverUrl, teamChannel.id, teamChannel.teamId);
            } else {
                joinIfNeededAndSwitchToChannel(serverUrl, {id: teamChannel.id}, {id: teamChannel.teamId}, () => logDebug('CommunityTeam: could not join the team channel'), intl);
            }
            return;
        }
        if (team.lead_id) {
            const {data} = await createDirectChannel(serverUrl, team.lead_id);
            if (data) {
                switchToChannelById(serverUrl, data.id);
            }
        }
    }, [teamChannel, isChannelMember, team.lead_id, serverUrl, intl]));

    let reach;
    if (teamChannel) {
        reach = (
            <Button
                theme={theme}
                size='lg'
                iconName='pound'
                text={formatMessage({id: 'community_team.jump', defaultMessage: 'Jump to #{channel}'}, {channel: teamChannel.displayName})}
                onPress={go}
                testID='community_team.jump'
            />
        );
    } else if (lead) {
        reach = (
            <Button
                theme={theme}
                size='lg'
                emphasis='tertiary'
                iconName='send'
                text={formatMessage({id: 'community_team.message_lead', defaultMessage: 'Message {name}, the lead'}, {name: lead.firstName || leadName})}
                onPress={go}
                testID='community_team.message_lead'
            />
        );
    }

    const shownMembers = members.slice(0, FACES);
    const moreMembers = memberIds.length - shownMembers.length;

    return (
        <View testID='community_team'>
            <View style={styles.head}>
                <View style={styles.bigTag}>
                    <Text style={styles.bigTagText}>{team.tag || team.display_name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.titles}>
                    <Text
                        style={styles.name}
                        numberOfLines={1}
                        testID='community_team.name'
                    >
                        {team.display_name}
                    </Text>
                    <Text
                        style={styles.sub}
                        numberOfLines={1}
                    >
                        {team.name ? `@${team.name}` : formatMessage({id: 'community_team.team', defaultMessage: 'Team'})}
                    </Text>
                </View>
            </View>
            {Boolean(team.description) && (
                <Text style={styles.description}>{team.description}</Text>
            )}
            <View style={styles.facts}>
                <Fact
                    icon='account-multiple-outline'
                    theme={theme}
                    text={formatMessage({id: 'community_team.members', defaultMessage: '{count, plural, one {# member} other {# members}}'}, {count: memberIds.length || team.member_count || 0})}
                />
                {Boolean(lead) && (
                    <Fact
                        icon='shield-outline'
                        theme={theme}
                        text={formatMessage({id: 'community_team.lead', defaultMessage: 'Lead: {name}'}, {name: leadName})}
                    />
                )}
                <Fact
                    icon={teamChannel ? 'pound' : 'message-text-outline'}
                    theme={theme}
                    text={teamChannel ? formatMessage({id: 'community_team.channel', defaultMessage: 'Channel: #{channel}'}, {channel: teamChannel.displayName}) : formatMessage({id: 'community_team.no_channel', defaultMessage: 'No team channel yet'})}
                />
            </View>
            {shownMembers.length > 0 && (
                <View style={styles.faces}>
                    {shownMembers.map((m) => (
                        <ProfilePicture
                            key={m.id}
                            author={m}
                            size={28}
                            showStatus={false}
                        />
                    ))}
                    {moreMembers > 0 && <Text style={styles.moreFaces}>{`+${moreMembers}`}</Text>}
                </View>
            )}
            {Boolean(reach) && <View style={styles.reach}>{reach}</View>}
        </View>
    );
};

export default CommunityTeam;
