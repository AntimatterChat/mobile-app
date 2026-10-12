// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {General} from '@constants';
import {shouldShowChannelBanner} from '@screens/channel/channel_feature_checks';

describe('shouldShowChannelBanner', () => {
    const validBannerInfo = {
        enabled: true,
        text: 'Banner text',
        background_color: '#FF0000',
    };

    it('should return false when the channel type is not provided', () => {
        expect(shouldShowChannelBanner(undefined, validBannerInfo)).toBe(false);
    });

    it('should return false when banner info is not provided', () => {
        expect(shouldShowChannelBanner(General.OPEN_CHANNEL, undefined)).toBe(false);
    });

    it('should return false when banner info is incomplete', () => {
        const incompleteBannerInfo = {
            enabled: true,
            text: 'Banner text',
            background_color: '',
        };
        expect(shouldShowChannelBanner(General.OPEN_CHANNEL, incompleteBannerInfo)).toBe(false);
    });

    it('should return false when banner is not enabled', () => {
        const disabledBannerInfo = {
            enabled: false,
            text: 'Banner text',
            background_color: '#FF0000',
        };
        expect(shouldShowChannelBanner(General.OPEN_CHANNEL, disabledBannerInfo)).toBe(false);
    });

    it('should return false for DM and GM channels', () => {
        expect(shouldShowChannelBanner(General.DM_CHANNEL, validBannerInfo)).toBe(false);
        expect(shouldShowChannelBanner(General.GM_CHANNEL, validBannerInfo)).toBe(false);
    });

    it('should return true for valid open channel with complete banner info', () => {
        expect(shouldShowChannelBanner(General.OPEN_CHANNEL, validBannerInfo)).toBe(true);
    });

    it('should return true for valid private channel with complete banner info', () => {
        expect(shouldShowChannelBanner(General.PRIVATE_CHANNEL, validBannerInfo)).toBe(true);
    });

    it('should return true when classification markings are enabled even without native banner', () => {
        expect(shouldShowChannelBanner(General.OPEN_CHANNEL, undefined, true)).toBe(true);
    });

    it('should return false when classification is enabled but channel type is DM', () => {
        expect(shouldShowChannelBanner(General.DM_CHANNEL, undefined, true)).toBe(false);
    });

    it('should return true when channel attributes are enabled without a native banner', () => {
        // An attribute designated for the banner is the only source on a server
        // that has channel attributes but not classification markings. Without this
        // the component never mounts and the banner is unreachable.
        expect(shouldShowChannelBanner(General.OPEN_CHANNEL, undefined, false, true)).toBe(true);
    });

    it('should return false when neither feature is enabled and there is no native banner', () => {
        expect(shouldShowChannelBanner(General.OPEN_CHANNEL, undefined, false, false)).toBe(false);
    });

    it('should still exclude DMs when channel attributes are enabled', () => {
        expect(shouldShowChannelBanner(General.DM_CHANNEL, undefined, false, true)).toBe(false);
    });
});
