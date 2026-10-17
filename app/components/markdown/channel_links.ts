// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Node} from 'commonmark';

// Antimatter writes channel links as #channel-name, the usual sign; Mattermost's ~channel-name keeps working. The
// parser only knows ~ links: linkHashChannels turns each #name a message may mean as a channel into a channel_link
// node, marked with the # it was written with. Whether it names a channel is only known when it's shown, from the
// post's channel_mentions (resolved by the server) and the community's channels (see ChannelMention): a #name that
// names none is shown as written, as a hashtag when it is one.
//
// As the server (model.ChannelMentions) and Fusion, a # isn't a channel link after a letter, a digit or _ (C#,
// page#anchor), after another # (##name) or & (&#39;), nor in a link or code; "# Title" is a heading.

export type ChannelLinkSigil = '~' | '#';

// A channel's name, as the server finds it after #: letters, digits, - and _, starting with a letter or digit.
const CHANNEL_NAME = /^[a-z0-9][a-z0-9_-]*$/i;

// A #name in text. A name followed by a letter or digit, even after a dot (#café, #v1.2), is a word, not a channel.
const HASH_NAME = /#([a-z0-9][a-z0-9_-]*)(?!\.?[\p{L}\p{N}])/giu;

// No channel link after these.
const NOT_AFTER = /^[\p{L}\p{N}_&#]$/u;

/* eslint-disable @typescript-eslint/no-explicit-any */

const lastChar = (s: string) => Array.from(s.slice(-2)).pop() ?? '';

// charBefore is what was written just before node, as far as the tree tells: the end of the text before it, a word
// character after a mention, channel link or hashtag, and nothing at the start of a block or after markup.
function charBefore(node: Node): string {
    const prev = node.prev;
    if (!prev) {
        return '';
    }
    switch (prev.type as string) {
        case 'text':
            return lastChar(prev.literal ?? '');
        case 'at_mention':
        case 'channel_link':
        case 'hashtag':
            return 'a';
        default:
            return '';
    }
}

function inLink(node: Node) {
    for (let parent = node.parent; parent; parent = parent.parent) {
        if (parent.type === 'link' || parent.type === 'image') {
            return true;
        }
    }
    return false;
}

function textNode(literal: string) {
    const node = new Node('text');
    node.literal = literal;
    return node;
}

// hashChannelNode is a #name channel link; hashtag is the hashtag it is when no channel has that name.
function hashChannelNode(name: string, hashtag?: string): Node {
    const node: any = new Node('channel_link' as any);
    node.channelName = name;
    node.sigil = '#';
    node.hashtag = hashtag;
    return node;
}

// linkHashChannels turns the #names of a parsed message into channel links. Run it after combineTextNodes, so a
// text node holds all the text between two other nodes.
export function linkHashChannels(ast: Node): Node {
    const hashtags: Node[] = [];
    const texts: Node[] = [];
    const walker = ast.walker();
    for (let e = walker.next(); e; e = walker.next()) {
        const type = e.node.type as string;
        if (!e.entering || inLink(e.node)) {
            continue;
        }
        if (type === 'hashtag') {
            hashtags.push(e.node);
        } else if (type === 'text' && e.node.literal?.includes('#')) {
            texts.push(e.node);
        }
    }

    // The parser's hashtags: #names that start with a letter, at least MinimumHashtagLength long.
    for (const node of hashtags) {
        const hashtag: string | undefined = (node as any).hashtag;
        if (hashtag && CHANNEL_NAME.test(hashtag) && !NOT_AFTER.test(charBefore(node))) {
            node.insertBefore(hashChannelNode(hashtag, hashtag));
            node.unlink();
        }
    }

    // The #names it leaves as text, such as #qa (too short for a hashtag) or #2026-plan (starting with a digit).
    for (const node of texts) {
        const literal = node.literal ?? '';
        let at = 0;
        for (const match of literal.matchAll(HASH_NAME)) {
            const index = match.index ?? 0;
            const before = index > 0 ? lastChar(literal.slice(0, index)) : charBefore(node);
            if (NOT_AFTER.test(before)) {
                continue;
            }
            if (index > at) {
                node.insertBefore(textNode(literal.slice(at, index)));
            }
            node.insertBefore(hashChannelNode(match[1]));
            at = index + match[0].length;
        }
        if (at === 0) {
            continue;
        }
        if (at < literal.length) {
            node.insertBefore(textNode(literal.slice(at)));
        }
        node.unlink();
    }

    return ast;
}

// getChannelLinkProps gives a renderer the sign a channel link was written with (# or ~), and for a #name, the
// hashtag it is when no channel has that name.
export function getChannelLinkProps(node: any): {sigil?: ChannelLinkSigil; hashtag?: string} {
    if (node?.type !== 'channel_link') {
        return {};
    }
    if (node.sigil === '#') {
        return {sigil: '#', hashtag: node.hashtag || undefined};
    }
    return {sigil: '~'};
}

/* eslint-enable @typescript-eslint/no-explicit-any */
