// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {acceptCommunityRules, fetchCommunityRules} from '@actions/remote/community_rules';
import Button from '@components/button';
import Loading from '@components/loading';
import Markdown from '@components/markdown';
import {Screens} from '@constants/index';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import useDidMount from '@hooks/did_mount';
import {navigateBack} from '@screens/navigation';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

type Props = {
    teamId: string;
    communityName?: string;
    rules?: CommunityRules;
}

const messages = defineMessages({
    title: {
        id: 'community_rules.title',
        defaultMessage: 'Rules of {communityName}',
    },
    agree: {
        id: 'community_rules.agree',
        defaultMessage: 'I agree',
    },
    notNow: {
        id: 'community_rules.not_now',
        defaultMessage: 'Not now',
    },
    errorTitle: {
        id: 'community_rules.error.title',
        defaultMessage: "Couldn't load the rules",
    },
    errorDescription: {
        id: 'community_rules.error.description',
        defaultMessage: "We couldn't get this community's rules from the server.",
    },
    retry: {
        id: 'community_rules.error.retry',
        defaultMessage: 'Retry',
    },
    changed: {
        id: 'community_rules.changed',
        defaultMessage: 'These rules just changed: read them again, then agree.',
    },
    acceptError: {
        id: 'community_rules.accept_error',
        defaultMessage: "We couldn't save that you agreed. Please try again.",
    },
});

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        root: {
            flex: 1,
            backgroundColor: changeOpacity('#000000', 0.50),
            justifyContent: 'center',
        },
        container: {
            flex: 1,
            maxWidth: 680,
            alignSelf: 'center',
            alignContent: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
        },
        wrapper: {
            backgroundColor: theme.centerChannelBg,
            borderRadius: 12,
            margin: 10,
            borderWidth: 1,
            borderColor: changeOpacity(theme.centerChannelColor, 0.16),
            padding: 24,
        },
        baseText: {
            color: theme.centerChannelColor,
            ...typography('Body', 100, 'Regular'),
        },
        title: {
            color: theme.centerChannelColor,
            ...typography('Heading', 600, 'SemiBold'),
            borderBottomWidth: 1,
            borderColor: changeOpacity(theme.centerChannelColor, 0.16),
            marginBottom: 12,
        },
        errorTitle: {
            color: theme.centerChannelColor,
            ...typography('Heading', 400, 'SemiBold'),
        },
        errorDescription: {
            marginBottom: 24,
            color: theme.centerChannelColor,
            ...typography('Body', 200, 'Regular'),
        },
        changedNotice: {
            marginBottom: 12,
            color: theme.errorTextColor,
            ...typography('Body', 100, 'SemiBold'),
        },
        loadingContainer: {
            justifyContent: 'center',
        },
        scrollView: {
            marginBottom: 24,
        },
        buttonContainer: {
            flexDirection: 'column',
            gap: 10,
        },
    };
});

const CommunityRulesScreen = ({teamId, communityName, rules}: Props) => {
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const intl = useIntl();
    const serverUrl = useServerUrl();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(!rules);
    const [error, setError] = useState(false);
    const [changed, setChanged] = useState(false);
    const [accepting, setAccepting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(false);
        const {error: fetchError} = await fetchCommunityRules(serverUrl, teamId);
        setLoading(false);
        setError(Boolean(fetchError));
    }, [serverUrl, teamId]);

    useDidMount(() => {
        if (!rules) {
            load();
        }
    });

    useAndroidHardwareBackHandler(Screens.COMMUNITY_RULES, navigateBack);

    const onAgree = useCallback(async () => {
        if (!rules) {
            return;
        }
        setAccepting(true);
        setChanged(false);
        const result = await acceptCommunityRules(serverUrl, teamId, rules.version);
        setAccepting(false);
        if (result.changed) {
            setChanged(true);
            return;
        }
        if (result.error) {
            setError(true);
            return;
        }
        navigateBack();
    }, [rules, serverUrl, teamId]);

    const onNotNow = useCallback(() => {
        navigateBack();
    }, []);

    const containerStyle = useMemo(() => {
        return [{
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            paddingTop: insets.top,
        }, styles.container];
    }, [styles, insets]);

    let content;
    if (loading) {
        content = (
            <View style={styles.loadingContainer}>
                <Loading color={theme.centerChannelColor}/>
            </View>
        );
    } else if (error || !rules) {
        content = (
            <>
                <Text style={styles.errorTitle}>{intl.formatMessage(messages.errorTitle)}</Text>
                <Text style={styles.errorDescription}>{intl.formatMessage(messages.errorDescription)}</Text>
                <Button
                    onPress={load}
                    theme={theme}
                    text={intl.formatMessage(messages.retry)}
                    size='lg'
                    testID='community_rules.retry.button'
                />
            </>
        );
    } else {
        content = (
            <>
                {changed && (
                    <Text
                        style={styles.changedNotice}
                        testID='community_rules.changed_notice'
                    >
                        {intl.formatMessage(messages.changed)}
                    </Text>
                )}
                <ScrollView style={styles.scrollView}>
                    <Markdown
                        baseTextStyle={styles.baseText}
                        value={rules.text}
                        location={Screens.COMMUNITY_RULES}
                        theme={theme}
                    />
                </ScrollView>
                <View style={styles.buttonContainer}>
                    <Button
                        onPress={onAgree}
                        theme={theme}
                        text={intl.formatMessage(messages.agree)}
                        size='lg'
                        disabled={accepting}
                        testID='community_rules.agree.button'
                    />
                    <Button
                        onPress={onNotNow}
                        theme={theme}
                        text={intl.formatMessage(messages.notNow)}
                        size='lg'
                        emphasis='link'
                        testID='community_rules.not_now.button'
                    />
                </View>
            </>
        );
    }

    return (
        <View
            style={styles.root}
            testID='community_rules.screen'
        >
            <View style={containerStyle}>
                <View style={styles.wrapper}>
                    <Text
                        style={styles.title}
                        testID='community_rules.title'
                    >
                        {intl.formatMessage(messages.title, {communityName: communityName || ''})}
                    </Text>
                    {content}
                </View>
            </View>
        </View>
    );
};

export default CommunityRulesScreen;
