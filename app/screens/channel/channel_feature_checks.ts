// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {of as of$, type Observable} from 'rxjs';
import {combineLatestWith, distinctUntilChanged, switchMap} from 'rxjs/operators';

import {General} from '@constants';
import {observeChannel} from '@queries/servers/channel';
import {observeChannelAttributesEnabled} from '@queries/servers/properties';
import {observeConfigValue} from '@queries/servers/system';

import type Database from '@nozbe/watermelondb/Database';

export function observeChannelBannerIncluded(database: Database, channelType: Observable<ChannelType | undefined>, channelId: Observable<string>): Observable<boolean> {
    const classificationFlag = observeConfigValue(database, 'FeatureFlagClassificationMarkings');
    const channelAttributesEnabled = observeChannelAttributesEnabled(database);
    const bannerInfo = channelId.pipe(
        switchMap((cId) => observeChannel(database, cId)),
        switchMap((channel) => of$(channel?.bannerInfo)),
    );

    return channelType.pipe(
        combineLatestWith(bannerInfo, classificationFlag, channelAttributesEnabled),
        switchMap(([channelTypeValue, bannerInfoValue, classificationEnabled, attributesEnabled]) =>
            of$(shouldShowChannelBanner(channelTypeValue, bannerInfoValue, classificationEnabled === 'true', attributesEnabled)),
        ),
        distinctUntilChanged(),
    );
}

export function shouldShowChannelBanner(channelType?: ChannelType, bannerInfo?: ChannelBannerInfo, classificationEnabled = false, channelAttributesEnabled = false): boolean {
    if (!channelType) {
        return false;
    }

    const isValidChannelType = channelType === General.OPEN_CHANNEL || channelType === General.PRIVATE_CHANNEL;
    if (!isValidChannelType) {
        return false;
    }

    const hasNativeBanner = Boolean(bannerInfo?.enabled && bannerInfo?.text && bannerInfo?.background_color);

    // Mount the banner component when a native banner is configured, when
    // classification markings are on, or when channel attributes are on — any of
    // the three can produce a banner, and the component resolves which. Without
    // the third, an attribute designated for the banner renders nothing on a
    // server that has channel attributes but not classification.
    return hasNativeBanner || classificationEnabled || channelAttributesEnabled;
}
