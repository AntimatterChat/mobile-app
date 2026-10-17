// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Parser, type Node} from 'commonmark';

import {getChannelLinkProps, linkHashChannels} from './channel_links';
import {combineTextNodes} from './transform';

/* eslint-disable @typescript-eslint/no-explicit-any */

// nodes lists the inline nodes of a block, with what they hold: channel links as #name or ~name, with the hashtag a
// #name falls back to.
function nodes(block: Node): any[] {
    const out = [];
    for (let child = block.firstChild; child; child = child.next) {
        const n: any = child;
        if (child.type === 'text' || child.type === 'code') {
            out.push(`${child.type}:${child.literal}`);
        } else if (n.type === 'channel_link') {
            const {sigil, hashtag} = getChannelLinkProps(n);
            out.push(`channel:${sigil}${n.channelName}${hashtag ? ` (hashtag ${hashtag})` : ''}`);
        } else if (n.type === 'hashtag') {
            out.push(`hashtag:${n.hashtag}`);
        } else if (child.firstChild) {
            out.push({[child.type]: nodes(child)});
        } else {
            out.push(child.type);
        }
    }
    return out;
}

// parse parses text as Markdown does (hashtags of 3 or more characters), and lists its first block's nodes.
function parse(text: string, minimumHashtagLength = 3) {
    const ast = linkHashChannels(combineTextNodes(new Parser({minimumHashtagLength}).parse(text)));
    return nodes(ast.firstChild!);
}

describe('linkHashChannels: #channel-name links (Antimatter)', () => {
    it('should make a #name hashtag a channel link, which falls back to the hashtag', () => {
        expect(parse('see #general now')).toEqual([
            'text:see ',
            'channel:#general (hashtag general)',
            'text: now',
        ]);
    });

    it('should link #names too short for a hashtag, or starting with a digit', () => {
        expect(parse('ask #qa about #2026-plan')).toEqual([
            'text:ask ',
            'channel:#qa',
            'text: about ',
            'channel:#2026-plan',
        ]);
    });

    it('should link #names at the start, after punctuation and before it', () => {
        expect(parse('#qa, (#ops) and #general.')).toEqual([
            'channel:#qa',
            'text:, (',
            'channel:#ops (hashtag ops)',
            'text:) and ',
            'channel:#general (hashtag general)',
            'text:.',
        ]);
    });

    it('should keep ~ links, marked as written with ~', () => {
        expect(parse('~general and #off-topic')).toEqual([
            'channel:~general',
            'text: and ',
            'channel:#off-topic (hashtag off-topic)',
        ]);
    });

    it('should link channels in headings, emphasis and lists', () => {
        expect(parse('## Notes for #qa')).toEqual(['text:Notes for ', 'channel:#qa']);
        expect(parse('**#release-notes**')).toEqual([{strong: ['channel:#release-notes (hashtag release-notes)']}]);
        expect(parse('- #qa')).toEqual([{item: [{paragraph: ['channel:#qa']}]}]);
    });

    it('should not link a # after a letter, a digit or _', () => {
        // The parser makes a hashtag after _, as it may close emphasis: it stays one.
        expect(parse('C# and page#anchor and 3#4 and snake_#case')).toEqual([
            'text:C# and page#anchor and 3#4 and snake_',
            'hashtag:case',
        ]);
        expect(parse('C# and snake_#qa')).toEqual(['text:C# and snake_#qa']);
    });

    it('should not link ##name', () => {
        expect(parse('a ##general b')).toEqual(['text:a #', 'hashtag:general', 'text: b']);
        expect(parse('a ##qa b')).toEqual(['text:a ##qa b']);
    });

    it('should not take a heading for a channel', () => {
        const ast = linkHashChannels(combineTextNodes(new Parser({minimumHashtagLength: 3}).parse('# general')));
        expect(ast.firstChild!.type).toBe('heading');
        expect(nodes(ast.firstChild!)).toEqual(['text:general']);
        expect(parse('\\# not a heading')).toEqual(['text:# not a heading']);
    });

    it('should not link HTML entities', () => {
        // &#39; is an apostrophe; &amp;#39; is "&#39;" written out.
        expect(parse('it&#39;s')).toEqual(["text:it's"]);
        expect(parse('&amp;#39; &amp;#qa')).toEqual(['text:&#39; &#qa']);
    });

    it('should not link in code or links', () => {
        expect(parse('`#qa` [see #qa](https://example.com) https://example.com/page#qa')).toEqual([
            'code:#qa',
            'text: ',
            {link: ['text:see #qa']},
            'text: ',
            {link: ['text:https://example.com/page#qa']},
        ]);
    });

    it('should leave words that aren\'t channel names as hashtags', () => {
        // A channel's name has no dots nor accents.
        expect(parse('#café #v1.2 #release.notes')).toEqual([
            'hashtag:café',
            'text: ',
            'hashtag:v1.2',
            'text: ',
            'hashtag:release.notes',
        ]);
        expect(parse('#qé #2é')).toEqual(['text:#qé #2é']);
    });

    it('should not link a hashtag right after a mention or another link', () => {
        expect(parse('@maya#qa ~ops#qa')).toEqual(['at_mention', 'text:#qa ', 'channel:~ops', 'text:#qa']);
    });

    it('should link with the parser\'s defaults too, as remove_markdown parses', () => {
        const ast = linkHashChannels(combineTextNodes(new Parser().parse('see #general')));
        expect(nodes(ast.firstChild!)).toEqual(['text:see ', 'channel:#general (hashtag general)']);
    });
});

describe('getChannelLinkProps', () => {
    it('should only give props to channel links', () => {
        expect(getChannelLinkProps({type: 'text'})).toEqual({});
        expect(getChannelLinkProps({type: 'channel_link'})).toEqual({sigil: '~'});
        expect(getChannelLinkProps({type: 'channel_link', sigil: '#', hashtag: null})).toEqual({sigil: '#', hashtag: undefined});
        expect(getChannelLinkProps({type: 'channel_link', sigil: '#', hashtag: 'release'})).toEqual({sigil: '#', hashtag: 'release'});
    });
});
