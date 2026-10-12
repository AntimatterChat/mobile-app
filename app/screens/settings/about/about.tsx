// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Clipboard from '@react-native-clipboard/clipboard';
import {applicationId, nativeApplicationVersion, nativeBuildVersion} from 'expo-application';
import React, {useCallback, useMemo} from 'react';
import {useIntl} from 'react-intl';
import {Text, View} from 'react-native';

import Config from '@assets/config.json';
import AntimatterLogo from '@components/antimatter_logo';
import Button from '@components/button';
import FormattedText from '@components/formatted_text';
import SettingContainer from '@components/settings/container';
import {Screens} from '@constants';
import AboutLinks from '@constants/about_links';
import {SNACK_BAR_TYPE} from '@constants/snack_bar';
import {useTheme} from '@context/theme';
import useAndroidHardwareBackHandler from '@hooks/android_back_handler';
import {useIsTablet} from '@hooks/device';
import {usePreventDoubleTap} from '@hooks/utils';
import {navigateBack} from '@screens/navigation';
import {showSnackBar} from '@utils/snack_bar';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';
import {tryOpenURL} from '@utils/url';
import {onOpenLinkError} from '@utils/url/links';

import LearnMore from './learn_more';
import Subtitle from './subtitle';
import Title from './title';
import TosPrivacyContainer from './tos_privacy';

const ANTIMATTER_BUNDLE_IDS = ['chat.antimatter.app', 'chat.antimatter.app.beta'];

const TABLET_EXTRA_PADDING = 20;

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        logoContainer: {
            alignItems: 'center',
            marginTop: 20,
        },

        // Extra inset on tablet around all About content (with SettingContainer's 20 → 40 horizontal total)
        tabletContentWrapper: {
            paddingHorizontal: TABLET_EXTRA_PADDING,
            paddingBottom: TABLET_EXTRA_PADDING,
        },
        lineStyles: {
            width: '100%',
            marginTop: 40,
            marginBottom: 24,
        },
        leftHeading: {
            ...typography('Body', 200, 'SemiBold'),
            marginRight: 8,
            color: theme.centerChannelColor,
        },
        rightHeading: {
            ...typography('Body', 200, 'Regular'),
            color: theme.centerChannelColor,
        },
        infoContainer: {
            flexDirection: 'column',
        },
        noticeContainer: {
            flexDirection: 'column',
        },
        noticeLink: {
            color: theme.linkColor,
            ...typography('Body', 50, 'Regular'),
        },
        hashContainer: {
            flexDirection: 'column',
        },
        footerTitleText: {
            color: changeOpacity(theme.centerChannelColor, 0.64),
            ...typography('Body', 50, 'SemiBold'),
        },
        footerText: {
            color: changeOpacity(theme.centerChannelColor, 0.64),
            ...typography('Body', 50),
            marginBottom: 10,
        },
        copyrightText: {
            marginBottom: 0,
        },
        tosPrivacyContainer: {
            flexDirection: 'row',
            marginBottom: 10,
        },
        group: {
            flexDirection: 'row',
        },
        copyInfoButtonContainer: {
            width: 120,
            marginTop: 10,
            position: 'relative',
        },
        thinLine: {
            height: 0.5,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
            alignSelf: 'stretch',
            marginVertical: 32,
        },
    };
});

type AboutProps = {
    config: ClientConfig;
}
const About = ({config}: AboutProps) => {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const isTablet = useIsTablet();

    const openURL = useCallback((url: string) => {
        const onError = () => {
            onOpenLinkError(intl);
        };

        tryOpenURL(url, onError);
    }, [intl]);

    const handleAboutTeam = usePreventDoubleTap(useCallback(() => {
        return openURL(Config.WebsiteURL);
    }, [openURL]));

    const handlePlatformNotice = usePreventDoubleTap(useCallback(() => {
        return openURL(Config.ServerNoticeURL);
    }, [openURL]));

    const handleMobileNotice = usePreventDoubleTap(useCallback(() => {
        return openURL(Config.MobileNoticeURL);
    }, [openURL]));

    const handleTermsOfService = usePreventDoubleTap(useCallback(() => {
        return openURL(AboutLinks.TERMS_OF_SERVICE);
    }, [openURL]));

    const handlePrivacyPolicy = usePreventDoubleTap(useCallback(() => {
        return openURL(AboutLinks.PRIVACY_POLICY);
    }, [openURL]));

    const serverVersion = useMemo(() => {
        const buildNumber = config.BuildNumber;
        const version = config.Version;

        // Antimatter servers don't set a build number
        if (!buildNumber || buildNumber === version) {
            return version;
        }

        return intl.formatMessage({id: 'settings.about.server.version.value', defaultMessage: '{version} (Build {buildNumber})'}, {version, buildNumber});
    }, [config, intl]);

    useAndroidHardwareBackHandler(Screens.ABOUT, navigateBack);

    const copyToClipboard = useCallback(
        () => {
            const appVersion = intl.formatMessage({id: 'settings.about.app.version', defaultMessage: 'App Version: {version} (Build {number})'}, {version: nativeApplicationVersion, number: nativeBuildVersion});
            const buildNumber = config.BuildNumber;
            const version = config.Version;
            const server = (!buildNumber || buildNumber === version) ? intl.formatMessage({id: 'settings.about.server.version.noBuild', defaultMessage: 'Server Version: {version}'}, {version}) : intl.formatMessage({id: 'settings.about.server.version', defaultMessage: 'Server Version: {version} (Build {buildNumber})'}, {version, buildNumber});
            const database = intl.formatMessage({id: 'settings.about.database', defaultMessage: 'Database: {driverName}'}, {driverName: config.SQLDriverName});
            const databaseSchemaVersion = intl.formatMessage({id: 'settings.about.database.schema', defaultMessage: 'Database Schema Version: {version}'}, {version: config.SchemaVersion});
            const copiedString = `${appVersion}\n${server}\n${database}\n${databaseSchemaVersion}`;

            Clipboard.setString(copiedString);
            showSnackBar({barType: SNACK_BAR_TYPE.INFO_COPIED, sourceScreen: Screens.ABOUT});
        },
        [intl, config.BuildNumber, config.Version, config.SQLDriverName, config.SchemaVersion],
    );

    return (
        <SettingContainer testID='about'>
            <View style={isTablet ? styles.tabletContentWrapper : undefined}>
                <View style={styles.logoContainer}>
                    <AntimatterLogo
                        size={80}
                        testID='about.logo'
                    />
                    <Title/>
                    <Subtitle/>
                    <View
                        style={styles.thinLine}
                    />
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.group}>
                        <Text
                            style={styles.leftHeading}
                            testID='about.app_version.title'
                        >
                            {intl.formatMessage({id: 'settings.about.app.version.title', defaultMessage: 'App Version:'})}
                        </Text>
                        <Text
                            style={styles.rightHeading}
                            testID='about.app_version.value'
                        >
                            {intl.formatMessage({id: 'settings.about.app.version.value', defaultMessage: '{version} (Build {number})'},
                                {version: nativeApplicationVersion, number: nativeBuildVersion})}
                        </Text>
                    </View>
                    <View style={styles.group}>
                        <Text
                            style={styles.leftHeading}
                            testID='about.server_version.title'
                        >
                            {intl.formatMessage({id: 'settings.about.server.version.title', defaultMessage: 'Server Version:'})}
                        </Text>
                        <Text
                            style={styles.rightHeading}
                            testID='about.server_version.value'
                        >
                            {serverVersion}
                        </Text>
                    </View>
                    <View style={styles.group}>
                        <Text
                            style={styles.leftHeading}
                            testID='about.database.title'
                        >
                            {intl.formatMessage({id: 'settings.about.database.title', defaultMessage: 'Database:'})}
                        </Text>
                        <Text
                            style={styles.rightHeading}
                            testID='about.database.value'
                        >
                            {config.SQLDriverName}
                        </Text>
                    </View>
                    <View style={styles.group}>
                        <Text
                            style={styles.leftHeading}
                            testID='about.database_schema_version.title'
                        >
                            {intl.formatMessage({id: 'settings.about.database.schema.title', defaultMessage: 'Database Schema Version:'})}
                        </Text>
                        <Text
                            style={styles.rightHeading}
                            testID='about.database_schema_version.value'
                        >
                            {config.SchemaVersion}
                        </Text>
                    </View>
                    <View style={styles.copyInfoButtonContainer}>
                        <Button
                            theme={theme}
                            onPress={copyToClipboard}
                            text={intl.formatMessage({id: 'settings.about.button.copyInfo', defaultMessage: 'Copy info'})}
                            testID={'about.copy_info'}
                            iconName='content-copy'
                            emphasis='tertiary'
                            size='m'
                        />
                    </View>
                    <LearnMore onPress={handleAboutTeam}/>
                    {!ANTIMATTER_BUNDLE_IDS.includes(applicationId || '') &&
                    <FormattedText
                        defaultMessage='{site} is powered by Antimatter'
                        id={'settings.about.powered_by'}
                        style={styles.footerText}
                        testID='about.powered_by'
                        values={{site: config.SiteName}}
                    />
                    }
                    <View
                        style={styles.thinLine}
                    />
                    <FormattedText
                        defaultMessage='Based on Mattermost. Copyright 2015-{currentYear} Mattermost, Inc. and the Antimatter contributors.'
                        id={'settings.about.copyright'}
                        style={[styles.footerText, styles.copyrightText]}
                        testID='about.copyright'
                        values={{currentYear: new Date().getFullYear()}}
                    />
                    <View style={styles.tosPrivacyContainer}>
                        <TosPrivacyContainer
                            config={config}
                            onPressPrivacyPolicy={handlePrivacyPolicy}
                            onPressTOS={handleTermsOfService}
                        />
                    </View>
                    <View style={styles.noticeContainer}>
                        <FormattedText
                            id={'settings.notice_text'}
                            defaultMessage='Antimatter is made possible by the open source software used in our {platform} and {mobile}.'
                            style={styles.footerText}
                            values={{
                                platform: (
                                    <FormattedText
                                        defaultMessage='server'
                                        id={'settings.notice_platform_link'}
                                        onPress={handlePlatformNotice}
                                        style={styles.noticeLink}
                                    />
                                ),
                                mobile: (
                                    <FormattedText
                                        defaultMessage='mobile apps'
                                        id={'settings.notice_mobile_link'}
                                        onPress={handleMobileNotice}
                                        style={[styles.noticeLink, {marginLeft: 5}]}
                                    />
                                ),
                            }}
                            testID='about.notice_text'
                        />
                    </View>
                    <View style={styles.hashContainer}>
                        <View>
                            <FormattedText
                                defaultMessage='Build Hash:'
                                id={'about.hash'}
                                style={styles.footerTitleText}
                                testID='about.build_hash.title'
                            />
                            <Text
                                style={styles.footerText}
                                testID='about.build_hash.value'
                            >
                                {config.BuildHash}
                            </Text>
                        </View>
                    </View>
                    <View style={{marginBottom: 20}}>
                        <FormattedText
                            defaultMessage='Build Date:'
                            id={'about.date'}
                            style={styles.footerTitleText}
                            testID='about.build_date.title'
                        />
                        <Text
                            style={styles.footerText}
                            testID='about.build_date.value'
                        >
                            {config.BuildDate}
                        </Text>
                    </View>
                </View>
            </View>
        </SettingContainer>
    );
};

export default About;
