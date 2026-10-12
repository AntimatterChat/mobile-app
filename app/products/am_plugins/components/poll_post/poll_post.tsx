// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {Alert, Pressable, Text, View} from 'react-native';

import {fetchMissingProfilesByIds} from '@actions/remote/user';
import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {getFullErrorMessage} from '@utils/errors';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {closePoll, fetchPoll, togglePollVote} from '../../actions/remote/polls';
import {endsIn, isPollEnded, percent, pollVoters} from '../../utils/polls';

import PollVoters from './poll_voters';

import type {Poll} from '../../types';
import type PostModel from '@typings/database/models/servers/post';

export const messages = defineMessages({
    selectOne: {id: 'am_plugins.polls.select_one', defaultMessage: 'Select one answer'},
    selectMany: {id: 'am_plugins.polls.select_many', defaultMessage: 'Select one or more answers'},
    anonymous: {id: 'am_plugins.polls.anonymous', defaultMessage: 'Anonymous'},
    votes: {id: 'am_plugins.polls.votes', defaultMessage: '{count, plural, one {# vote} other {# votes}}'},
    endsIn: {id: 'am_plugins.polls.ends_in', defaultMessage: 'Ends {when}'},
    closed: {id: 'am_plugins.polls.closed', defaultMessage: 'Final results'},
    closePoll: {id: 'am_plugins.polls.close', defaultMessage: 'Close poll'},
    closeConfirm: {id: 'am_plugins.polls.close_confirm', defaultMessage: 'Close the poll? Nobody will be able to vote anymore.'},
    cancel: {id: 'am_plugins.polls.cancel', defaultMessage: 'Cancel'},
    loading: {id: 'am_plugins.polls.loading', defaultMessage: 'Loading the poll…'},
    unavailable: {id: 'am_plugins.polls.unavailable', defaultMessage: 'This poll is no longer available.'},
    voteFailed: {id: 'am_plugins.polls.vote_failed', defaultMessage: 'Your vote couldn\'t be saved: {error}'},
    closeFailed: {id: 'am_plugins.polls.close_failed', defaultMessage: 'The poll couldn\'t be closed: {error}'},
    option: {id: 'am_plugins.polls.option', defaultMessage: '{text}: {percent}%'},
});

// How often the time left before the poll ends is shown again.
const TICK_MS = 60000;

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    card: {
        borderWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.16),
        borderRadius: 8,
        padding: 12,
        gap: 8,
        backgroundColor: theme.centerChannelBg,
    },
    question: {
        color: theme.centerChannelColor,
        ...typography('Heading', 200, 'SemiBold'),
    },
    sub: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75),
    },
    option: {
        minHeight: 40,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.12),
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.04),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 8,
        overflow: 'hidden',
    },
    optionMine: {
        borderColor: theme.buttonBg,
    },
    fill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: changeOpacity(theme.buttonBg, 0.12),
    },
    fillMine: {
        backgroundColor: changeOpacity(theme.buttonBg, 0.24),
    },
    mark: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.5,
        borderColor: changeOpacity(theme.centerChannelColor, 0.32),
        alignItems: 'center',
        justifyContent: 'center',
    },
    markMulti: {
        borderRadius: 4,
    },
    markMine: {
        borderColor: theme.buttonBg,
        backgroundColor: theme.buttonBg,
    },
    optionText: {
        flex: 1,
        color: theme.centerChannelColor,
        ...typography('Body', 100),
    },
    optionTextMine: {
        ...typography('Body', 100, 'SemiBold'),
    },
    pct: {
        color: changeOpacity(theme.centerChannelColor, 0.72),
        ...typography('Body', 75, 'SemiBold'),
        minWidth: 36,
        textAlign: 'right',
    },
    foot: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    footText: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75),
    },
    closeButton: {
        marginLeft: 'auto',
        paddingVertical: 2,
    },
    closeText: {
        color: theme.linkColor,
        ...typography('Body', 75, 'SemiBold'),
    },
    error: {
        color: theme.errorTextColor,
        ...typography('Body', 75),
    },
    pressed: {
        opacity: 0.72,
    },
}));

type Props = {
    post: PostModel;
    poll?: Poll;
    currentUserId: string;
    canModerate: boolean;
};

const usePollNow = (poll?: Poll) => {
    const [now, setNow] = useState(Date.now);
    const ticking = Boolean(poll?.end_at) && !poll?.closed;
    useEffect(() => {
        if (!ticking) {
            return undefined;
        }
        const timer = setInterval(() => setNow(Date.now()), TICK_MS);
        return () => clearInterval(timer);
    }, [ticking]);
    return now;
};

type OptionProps = {
    channelId: string;
    disabled: boolean;
    index: number;
    mine: boolean;
    multi: boolean;
    onVote: (index: number) => void;
    pct: number;
    text: string;
    voterIds?: string[];
};

const PollOption = ({channelId, disabled, index, mine, multi, onVote, pct, text, voterIds}: OptionProps) => {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const onPress = useCallback(() => onVote(index), [index, onVote]);
    const fillStyle = useMemo(() => [styles.fill, mine && styles.fillMine, {width: `${pct}%` as const}], [mine, pct, styles]);

    return (
        <Pressable
            accessibilityRole={multi ? 'checkbox' : 'radio'}
            accessibilityState={{checked: mine, disabled}}
            accessibilityLabel={intl.formatMessage(messages.option, {text, percent: pct})}
            disabled={disabled}
            onPress={onPress}
            style={({pressed}) => [styles.option, mine && styles.optionMine, pressed && styles.pressed]}
            testID={`poll_post.option.${index}`}
        >
            <View style={fillStyle}/>
            <View style={[styles.mark, multi && styles.markMulti, mine && styles.markMine]}>
                {mine && (
                    <CompassIcon
                        name='check'
                        size={14}
                        color={theme.buttonColor}
                    />
                )}
            </View>
            <Text style={[styles.optionText, mine && styles.optionTextMine]}>{text}</Text>
            {voterIds && voterIds.length > 0 && (
                <PollVoters
                    channelId={channelId}
                    voterIds={voterIds}
                />
            )}
            <Text style={styles.pct}>{`${pct}%`}</Text>
        </Pressable>
    );
};

// PollPost is the card of a poll (custom_poll posts of the polls plugin): its question, its answers
// with their live results, and voting, as the plugin's web component does.
const PollPost = ({post, poll, currentUserId, canModerate}: Props) => {
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const pollId = typeof post.props?.poll_id === 'string' ? post.props.poll_id : '';
    const [failed, setFailed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const now = usePollNow(poll);
    const known = Boolean(poll);

    useEffect(() => {
        if (!pollId) {
            setFailed(true);
            return;
        }
        if (!known) {
            fetchPoll(serverUrl, pollId).then(({poll: loaded}) => setFailed(!loaded));
        }
    }, [pollId, known, serverUrl]);

    // The voters' profiles may not be loaded yet
    const voterKey = poll ? pollVoters(poll).sort().join(',') : '';
    useEffect(() => {
        if (voterKey) {
            fetchMissingProfilesByIds(serverUrl, voterKey.split(','));
        }
    }, [serverUrl, voterKey]);

    const ended = poll ? isPollEnded(poll, now) : false;

    const onVote = useCallback(async (option: number) => {
        if (!poll || ended || busy) {
            return;
        }
        setBusy(true);
        setError('');
        const result = await togglePollVote(serverUrl, poll, option);
        if (result.error) {
            setError(intl.formatMessage(messages.voteFailed, {error: getFullErrorMessage(result.error)}));
        }
        setBusy(false);
    }, [poll, ended, busy, serverUrl, intl]);

    const onClose = useCallback(() => {
        if (!poll) {
            return;
        }
        Alert.alert(
            intl.formatMessage(messages.closePoll),
            intl.formatMessage(messages.closeConfirm),
            [
                {text: intl.formatMessage(messages.cancel), style: 'cancel'},
                {
                    text: intl.formatMessage(messages.closePoll),
                    style: 'destructive',
                    onPress: async () => {
                        setBusy(true);
                        setError('');
                        const result = await closePoll(serverUrl, poll.id);
                        if (result.error) {
                            setError(intl.formatMessage(messages.closeFailed, {error: getFullErrorMessage(result.error)}));
                        }
                        setBusy(false);
                    },
                },
            ],
        );
    }, [poll, intl, serverUrl]);

    if (!poll) {
        return (
            <View
                style={styles.card}
                testID='poll_post.placeholder'
            >
                <FormattedText
                    {...(failed ? messages.unavailable : messages.loading)}
                    style={styles.sub}
                />
            </View>
        );
    }

    let status = '';
    if (ended) {
        status = intl.formatMessage(messages.closed);
    } else {
        const left = endsIn(poll, now);
        if (left) {
            status = intl.formatMessage(messages.endsIn, {when: intl.formatRelativeTime(left.value, left.unit)});
        }
    }
    const canClose = !ended && (poll.creator_id === currentUserId || canModerate);
    let sub = intl.formatMessage(poll.multi ? messages.selectMany : messages.selectOne);
    if (poll.anonymous) {
        sub += ` · ${intl.formatMessage(messages.anonymous)}`;
    }

    return (
        <View
            style={styles.card}
            testID={`poll_post.${poll.id}`}
        >
            <Text style={styles.question}>{poll.question}</Text>
            <Text style={styles.sub}>{sub}</Text>
            {poll.options.map((option, i) => (
                <PollOption
                    key={option.text}
                    channelId={poll.channel_id}
                    disabled={ended || busy}
                    index={i}
                    mine={poll.my_votes.includes(i)}
                    multi={poll.multi}
                    onVote={onVote}
                    pct={percent(poll, i)}
                    text={option.text}
                    voterIds={option.voters}
                />
            ))}
            <View style={styles.foot}>
                <FormattedText
                    {...messages.votes}
                    values={{count: poll.voter_count}}
                    style={styles.footText}
                />
                {Boolean(status) && <Text style={styles.footText}>{`· ${status}`}</Text>}
                {canClose && (
                    <Pressable
                        disabled={busy}
                        onPress={onClose}
                        style={({pressed}) => [styles.closeButton, pressed && styles.pressed]}
                        testID='poll_post.close'
                    >
                        <FormattedText
                            {...messages.closePoll}
                            style={styles.closeText}
                        />
                    </Pressable>
                )}
            </View>
            {Boolean(error) && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

export default PollPost;
