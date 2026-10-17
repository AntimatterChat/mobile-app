// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {CHANNEL_MENTION_REGEX} from '@constants/autocomplete';

// Antimatter writes channel links as #channel-name, the usual sign, as Fusion does; Mattermost's ~channel-name keeps
// working, typed or in older messages.
export const CHANNEL_LINK_SIGN = '#';

export type ChannelMentionMatch = {

    // The sign typed: # or ~.
    sign: '#' | '~';

    // What follows it, lower case: the channel name, or part of it, being typed.
    term: string;
};

// getChannelMentionMatch finds the channel link being typed at the end of text with pattern (CHANNEL_MENTION_REGEX,
// or CHANNEL_MENTION_REGEX_DELAYED). It leaves out what isn't a channel link, as Fusion does: two signs in a row
// (## is a heading, and ~~ is what completing leaves for a moment on iOS), &# (an HTML entity such as &#39;) and a
// # followed by a space (a heading).
export function getChannelMentionMatch(text: string, pattern: RegExp = CHANNEL_MENTION_REGEX): ChannelMentionMatch | null {
    const match = text.match(pattern);
    if (!match || match.index === undefined) {
        return null;
    }

    const sign = match[1][0] as '#' | '~';
    const term = match[2];
    const before = match.index > 0 ? text[match.index - 1] : '';
    if (before === sign) {
        return null;
    }
    if (sign === '#' && (before === '&' || (/^\s/).test(term))) {
        return null;
    }

    return {sign, term: term.toLowerCase()};
}

// completeChannelMention replaces the channel link being typed at the end of text with #mention and a space, whether
// it was started with # or ~. With doubled, the sign is doubled (##mention): iOS's autocorrect leaves that alone, and
// the caller then puts the single sign back.
export function completeChannelMention(text: string, mention: string, doubled = false): string {
    const sign = doubled ? CHANNEL_LINK_SIGN + CHANNEL_LINK_SIGN : CHANNEL_LINK_SIGN;
    return text.replace(CHANNEL_MENTION_REGEX, () => `${sign}${mention} `);
}

// stripChannelSign takes the sign off a channel named #channel-name or ~channel-name, as slash commands take them.
export function stripChannelSign(name: string): string {
    return name.startsWith('#') || name.startsWith('~') ? name.substring(1) : name;
}
