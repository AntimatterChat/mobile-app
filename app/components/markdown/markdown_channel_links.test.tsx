// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {screen} from '@testing-library/react-native';
import React from 'react';

import {Preferences, Screens} from '@constants';
import {renderWithIntl} from '@test/intl-test-helper';

import Markdown from './markdown';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@screens/navigation', () => ({
    navigateToRoot: jest.fn(),
}));

// ChannelMention looks the channel up in the database: here it shows what it was given, and what it shows when no
// channel has that name.
const mockChannelMention = jest.fn();
jest.mock('./channel_mention', () => {
    const MockReact = require('react');
    const {Text} = require('react-native');

    return {
        __esModule: true,
        default: (props: any) => {
            mockChannelMention(props);
            return MockReact.createElement(Text, {testID: `channel_mention.${props.sigil}${props.channelName}`}, props.unresolved);
        },
    };
});

// Antimatter: channels are linked as #channel-name; Mattermost's ~channel-name keeps working.
describe('Markdown channel links', () => {
    const baseProps: React.ComponentProps<typeof Markdown> = {
        baseTextStyle: {},
        enableInlineLatex: true,
        enableLatex: true,
        location: Screens.CHANNEL,
        maxNodes: 2000,
        theme: Preferences.THEMES.denim,
        channelMentions: {general: {display_name: 'General'}},
    };

    beforeEach(() => {
        mockChannelMention.mockClear();
    });

    it('should link #names and ~names to their channels, with the post\'s channel_mentions', () => {
        renderWithIntl(
            <Markdown
                {...baseProps}
                value='see #general, #qa, #2026-plan and ~off-topic'
            />,
        );

        expect(screen.getByTestId('channel_mention.#general')).toBeTruthy();
        expect(screen.getByTestId('channel_mention.#qa')).toBeTruthy();
        expect(screen.getByTestId('channel_mention.#2026-plan')).toBeTruthy();
        expect(screen.getByTestId('channel_mention.~off-topic')).toBeTruthy();
        expect(mockChannelMention).toHaveBeenCalledWith(expect.objectContaining({
            channelName: 'general',
            sigil: '#',
            channelMentions: baseProps.channelMentions,
        }));
        expect(mockChannelMention).toHaveBeenCalledWith(expect.objectContaining({channelName: 'off-topic', sigil: '~', unresolved: undefined}));
    });

    it('should show a #name that names no channel as its hashtag, or as written', () => {
        renderWithIntl(
            <Markdown
                {...baseProps}
                value='#release and #qa'
            />,
        );

        // The hashtag is a link to search for it; #qa is too short to be one.
        expect(screen.getByTestId('channel_mention.#release')).toHaveTextContent('#release');
        expect(screen.getByTestId('channel_mention.#qa')).toHaveTextContent('#qa');
        const release = mockChannelMention.mock.calls.find(([props]) => props.channelName === 'release')![0];
        expect(release.unresolved.props.hashtag).toBe('release');
    });

    it('should show plain text for a #name that isn\'t a channel when hashtags are off', () => {
        renderWithIntl(
            <Markdown
                {...baseProps}
                disableHashtags={true}
                value='#release'
            />,
        );

        const release = mockChannelMention.mock.calls.find(([props]) => props.channelName === 'release')![0];
        expect(release.unresolved.props.hashtag).toBeUndefined();
        expect(screen.getByText('#release')).toBeTruthy();
    });

    it('should show links as written when channel links are off', () => {
        renderWithIntl(
            <Markdown
                {...baseProps}
                disableChannelLink={true}
                value='#qa ~off-topic'
            />,
        );

        expect(mockChannelMention).not.toHaveBeenCalled();
        expect(screen.getByText('#qa')).toBeTruthy();
        expect(screen.getByText('~off-topic')).toBeTruthy();
    });

    it('should leave C#, ## and headings alone', () => {
        renderWithIntl(
            <Markdown
                {...baseProps}
                value={'# general\nC# and ##general'}
            />,
        );

        expect(mockChannelMention).not.toHaveBeenCalled();
    });
});
