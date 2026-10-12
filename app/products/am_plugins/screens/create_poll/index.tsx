// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useNavigation} from 'expo-router';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {defineMessages, useIntl, type IntlShape} from 'react-intl';
import {Keyboard, Pressable, Text, View} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller';
import {SafeAreaView} from 'react-native-safe-area-context';

import CompassIcon from '@components/compass_icon';
import FloatingTextInput from '@components/floating_input/floating_text_input_label';
import FormattedText from '@components/formatted_text';
import NavigationButton from '@components/navigation_button';
import OptionItem from '@components/option_item';
import {Screens} from '@constants';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import {navigateBack} from '@screens/navigation';
import {getFullErrorMessage} from '@utils/errors';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {createPoll} from '../../actions/remote/polls';
import {
    POLL_DEFAULT_DURATION,
    POLL_DURATIONS,
    POLL_MAX_OPTION_LENGTH,
    POLL_MAX_OPTIONS,
    POLL_MAX_QUESTION_LENGTH,
    POLL_MIN_OPTIONS,
} from '../../constants';
import {composerMessages} from '../../hooks/composer_actions';
import {cleanPollOptions} from '../../utils/polls';

export const messages = defineMessages({
    lead: {id: 'am_plugins.polls.create.lead', defaultMessage: 'Everyone in the conversation can vote. Results update live.'},
    question: {id: 'am_plugins.polls.create.question', defaultMessage: 'Question'},
    questionPlaceholder: {id: 'am_plugins.polls.create.question_placeholder', defaultMessage: 'What should we decide?'},
    answers: {id: 'am_plugins.polls.create.answers', defaultMessage: 'Answers'},
    answer: {id: 'am_plugins.polls.create.answer', defaultMessage: 'Answer {n}'},
    removeAnswer: {id: 'am_plugins.polls.create.remove_answer', defaultMessage: 'Remove answer {n}'},
    addAnswer: {id: 'am_plugins.polls.create.add_answer', defaultMessage: 'Add answer'},
    multi: {id: 'am_plugins.polls.create.multi', defaultMessage: 'Allow multiple answers'},
    multiHelp: {id: 'am_plugins.polls.create.multi_help', defaultMessage: 'Voters can pick more than one option.'},
    anonymous: {id: 'am_plugins.polls.create.anonymous', defaultMessage: 'Anonymous voting'},
    anonymousHelp: {id: 'am_plugins.polls.create.anonymous_help', defaultMessage: 'Nobody sees who voted for what.'},
    duration: {id: 'am_plugins.polls.create.duration', defaultMessage: 'Duration'},
    hours: {id: 'am_plugins.polls.create.hours', defaultMessage: '{n, plural, one {# hour} other {# hours}}'},
    days: {id: 'am_plugins.polls.create.days', defaultMessage: '{n, plural, one {# day} other {# days}}'},
    weeks: {id: 'am_plugins.polls.create.weeks', defaultMessage: '{n, plural, one {# week} other {# weeks}}'},
    noEnd: {id: 'am_plugins.polls.create.no_end', defaultMessage: 'No end'},
    post: {id: 'am_plugins.polls.create.post', defaultMessage: 'Post'},
    needQuestion: {id: 'am_plugins.polls.create.need_question', defaultMessage: 'Ask a question'},
    tooFewAnswers: {id: 'am_plugins.polls.create.too_few', defaultMessage: 'Add at least two answers'},
    tooManyAnswers: {id: 'am_plugins.polls.create.too_many', defaultMessage: 'Polls can have up to 10 answers'},
    needTwoAnswers: {id: 'am_plugins.polls.create.need_two', defaultMessage: 'A poll needs at least two answers'},
    createFailed: {id: 'am_plugins.polls.create.failed', defaultMessage: 'The poll couldn\'t be created: {error}'},
});

// durationLabel names a poll duration in minutes, as the plugin's dialog does.
export function durationLabel(intl: IntlShape, minutes: number) {
    if (!minutes) {
        return intl.formatMessage(messages.noEnd);
    }
    if (minutes % (7 * 24 * 60) === 0) {
        return intl.formatMessage(messages.weeks, {n: minutes / (7 * 24 * 60)});
    }
    if (minutes % (24 * 60) === 0) {
        return intl.formatMessage(messages.days, {n: minutes / (24 * 60)});
    }
    return intl.formatMessage(messages.hours, {n: Math.round(minutes / 60)});
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.centerChannelBg,
    },
    content: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 16,
    },
    lead: {
        color: changeOpacity(theme.centerChannelColor, 0.72),
        ...typography('Body', 100),
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        color: theme.centerChannelColor,
        ...typography('Heading', 100, 'SemiBold'),
    },
    remove: {
        padding: 4,
    },
    add: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingVertical: 4,
    },
    addText: {
        color: theme.buttonBg,
        ...typography('Body', 100, 'SemiBold'),
    },
    error: {
        color: theme.errorTextColor,
        ...typography('Body', 100),
    },
    pressed: {
        opacity: 0.72,
    },
}));

type Answer = {id: number; text: string};

function withAnswerText(answers: Answer[], id: number, text: string) {
    return answers.map((a) => (a.id === id ? {...a, text} : a));
}

export type CreatePollProps = {
    channelId: string;
    rootId?: string;
};

const SAFE_AREA_EDGES = ['bottom', 'left', 'right'] as const;

// CreatePoll is the poll creation form of the polls plugin, as the Fusion web UI's dialog: a
// question, two to ten answers, single or multiple choice, anonymous or not, and how long it lasts.
const CreatePoll = ({channelId, rootId}: CreatePollProps) => {
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const navigation = useNavigation();
    const styles = getStyleSheet(theme);
    const nextId = useRef(4);
    const [question, setQuestion] = useState('');
    const [answers, setAnswers] = useState<Answer[]>([{id: 1, text: ''}, {id: 2, text: ''}, {id: 3, text: ''}]);
    const [multi, setMulti] = useState(false);
    const [anonymous, setAnonymous] = useState(false);
    const [duration, setDuration] = useState(POLL_DEFAULT_DURATION);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const close = useCallback(() => {
        Keyboard.dismiss();
        navigateBack();
    }, []);

    const addAnswer = useCallback(() => {
        if (answers.length >= POLL_MAX_OPTIONS) {
            setError(intl.formatMessage(messages.tooManyAnswers));
            return;
        }
        setError('');
        setAnswers([...answers, {id: nextId.current++, text: ''}]);
    }, [answers, intl]);

    const removeAnswer = useCallback((id: number) => {
        if (answers.length <= POLL_MIN_OPTIONS) {
            setError(intl.formatMessage(messages.needTwoAnswers));
            return;
        }
        setError('');
        setAnswers(answers.filter((a) => a.id !== id));
    }, [answers, intl]);

    const onMulti = useCallback((value: string | boolean) => setMulti(Boolean(value)), []);
    const onAnonymous = useCallback((value: string | boolean) => setAnonymous(Boolean(value)), []);
    const onDuration = useCallback((value: string | boolean) => setDuration(Number(value)), []);

    const changeAnswer = useCallback((id: number, text: string) => {
        setAnswers((current) => withAnswerText(current, id, text));
    }, []);

    const submit = useCallback(async () => {
        if (submitting) {
            return;
        }
        if (!question.trim()) {
            setError(intl.formatMessage(messages.needQuestion));
            return;
        }
        const options = cleanPollOptions(answers.map((a) => a.text));
        if (options.length < POLL_MIN_OPTIONS) {
            setError(intl.formatMessage(messages.tooFewAnswers));
            return;
        }
        setSubmitting(true);
        setError('');
        const result = await createPoll(serverUrl, {
            channel_id: channelId,
            root_id: rootId || undefined,
            question: question.trim(),
            options,
            multi,
            anonymous,
            duration_minutes: duration,
        });
        if (result.error) {
            setError(intl.formatMessage(messages.createFailed, {error: getFullErrorMessage(result.error)}));
            setSubmitting(false);
            return;
        }
        close();
    }, [submitting, question, answers, serverUrl, channelId, rootId, multi, anonymous, duration, intl, close]);

    const canPost = Boolean(question.trim()) && !submitting;
    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <NavigationButton
                    onPress={submit}
                    text={intl.formatMessage(messages.post)}
                    testID='create_poll.post.button'
                    color={canPost ? theme.sidebarHeaderTextColor : changeOpacity(theme.sidebarHeaderTextColor, 0.5)}
                    disabled={!canPost}
                />
            ),
        });
    }, [navigation, submit, canPost, intl, theme.sidebarHeaderTextColor]);

    useAndroidHardwareBackHandler(Screens.AM_CREATE_POLL, close);

    return (
        <SafeAreaView
            edges={SAFE_AREA_EDGES}
            style={styles.container}
            testID='create_poll.screen'
        >
            <KeyboardAwareScrollView
                bounces={false}
                keyboardShouldPersistTaps='handled'
                bottomOffset={62}
                contentContainerStyle={styles.content}
            >
                <FormattedText
                    {...messages.lead}
                    style={styles.lead}
                />
                <FloatingTextInput
                    label={intl.formatMessage(messages.question)}
                    placeholder={intl.formatMessage(messages.questionPlaceholder)}
                    value={question}
                    onChangeText={setQuestion}
                    maxLength={POLL_MAX_QUESTION_LENGTH}
                    autoFocus={true}
                    disableFullscreenUI={true}
                    returnKeyType='next'
                    testID='create_poll.question.input'
                    theme={theme}
                />
                <View style={styles.section}>
                    <FormattedText
                        {...messages.answers}
                        style={styles.sectionTitle}
                    />
                    {answers.map((answer, i) => (
                        <AnswerInput
                            key={answer.id}
                            answer={answer}
                            index={i}
                            onChange={changeAnswer}
                            onRemove={removeAnswer}
                        />
                    ))}
                    <Pressable
                        onPress={addAnswer}
                        style={({pressed}) => [styles.add, pressed && styles.pressed]}
                        testID='create_poll.add_answer'
                    >
                        <CompassIcon
                            name='plus'
                            size={18}
                            color={theme.buttonBg}
                        />
                        <FormattedText
                            {...messages.addAnswer}
                            style={styles.addText}
                        />
                    </Pressable>
                </View>
                <View>
                    <OptionItem
                        type='toggle'
                        label={intl.formatMessage(messages.multi)}
                        description={intl.formatMessage(messages.multiHelp)}
                        selected={multi}
                        action={onMulti}
                        testID='create_poll.multi'
                    />
                    <OptionItem
                        type='toggle'
                        label={intl.formatMessage(messages.anonymous)}
                        description={intl.formatMessage(messages.anonymousHelp)}
                        selected={anonymous}
                        action={onAnonymous}
                        testID='create_poll.anonymous'
                    />
                </View>
                <View>
                    <FormattedText
                        {...messages.duration}
                        style={styles.sectionTitle}
                    />
                    {POLL_DURATIONS.map((minutes) => (
                        <OptionItem
                            key={minutes}
                            type='select'
                            label={durationLabel(intl, minutes)}
                            value={String(minutes)}
                            selected={duration === minutes}
                            action={onDuration}
                            testID={`create_poll.duration.${minutes}`}
                        />
                    ))}
                </View>
                {Boolean(error) && (
                    <Text
                        style={styles.error}
                        testID='create_poll.error'
                    >
                        {error}
                    </Text>
                )}
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};

type AnswerInputProps = {
    answer: Answer;
    index: number;
    onChange: (id: number, text: string) => void;
    onRemove: (id: number) => void;
};

const AnswerInput = ({answer, index, onChange, onRemove}: AnswerInputProps) => {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const label = intl.formatMessage(messages.answer, {n: index + 1});
    const onChangeText = useCallback((text: string) => onChange(answer.id, text), [answer.id, onChange]);
    const remove = useCallback(() => onRemove(answer.id), [answer.id, onRemove]);

    return (
        <FloatingTextInput
            label={label}
            value={answer.text}
            onChangeText={onChangeText}
            maxLength={POLL_MAX_OPTION_LENGTH}
            disableFullscreenUI={true}
            returnKeyType='next'
            testID={`create_poll.answer.${index}`}
            theme={theme}
            endAdornment={(
                <Pressable
                    accessibilityLabel={intl.formatMessage(messages.removeAnswer, {n: index + 1})}
                    onPress={remove}
                    hitSlop={8}
                    style={({pressed}) => [styles.remove, pressed && styles.pressed]}
                    testID={`create_poll.answer.${index}.remove`}
                >
                    <CompassIcon
                        name='close'
                        size={18}
                        color={changeOpacity(theme.centerChannelColor, 0.56)}
                    />
                </Pressable>
            )}
        />
    );
};

export const createPollTitle = composerMessages.createPoll;

export default CreatePoll;
