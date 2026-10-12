// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Parser, type Node} from 'commonmark';

import {applyAntimatterSyntax} from './antimatter_transform';
import {combineTextNodes} from './transform';

/* eslint-disable @typescript-eslint/no-explicit-any */

// describe lists the nodes of a paragraph, with their text.
function describe_(node: Node): any[] {
    const out = [];
    for (let child = node.firstChild; child; child = child.next) {
        const n: any = child;
        if (child.type === 'text' || child.type === 'code') {
            out.push(`${child.type}:${child.literal}`);
        } else if (child.type === 'am_timestamp' as any) {
            out.push(`timestamp:${n.seconds}:${n.timestampStyle}`);
        } else if (child.type === 'am_walltime' as any) {
            out.push(`walltime:${n.literal}:${n.zone}:${n.explicit}`);
        } else if (child.firstChild) {
            out.push({[child.type]: describe_(child)});
        } else {
            out.push(child.type);
        }
    }
    return out;
}

function parse(text: string, walltime?: Parameters<typeof applyAntimatterSyntax>[1]) {
    return describe_(applyAntimatterSyntax(combineTextNodes(new Parser().parse(text)), walltime).firstChild!);
}

// Friday, October 9 2026, 10:00 in New York.
const walltime = {zone: 'America/New_York', postedAt: Date.UTC(2026, 9, 9, 14, 0)};

describe('Antimatter markdown', () => {
    it('should make lines starting with "-# " subtext', () => {
        expect(parse('Shipped!\n-# small **print**\nback')).toEqual([
            'text:Shipped!',
            'softbreak',
            {custom_inline: ['text:small ', {strong: ['text:print']}]},
            'softbreak',
            'text:back',
        ]);
    });

    it('should leave "-#" alone elsewhere than at the start of a line', () => {
        expect(parse('a -# b')).toEqual(['text:a -# b']);
    });

    it('should find dynamic timestamps, but not in code', () => {
        expect(parse('Freeze <t:1791216000:F> and `<t:1791216000>`')).toEqual([
            'text:Freeze ',
            'timestamp:1791216000:F',
            'text: and ',
            'code:<t:1791216000>',
        ]);
    });

    it('should find walltimes when given the author\'s time zone, beside timestamps', () => {
        expect(parse('Standup 9:15 or 3pm CET, <t:1791216000:t>', walltime)).toEqual([
            'text:Standup ',
            'walltime:9:15:America/New_York:false',
            'text: or ',
            'walltime:3pm CET:Europe/Paris:true',
            'text:, ',
            'timestamp:1791216000:t',
        ]);
        expect(parse('Standup 9:15')).toEqual(['text:Standup 9:15']);
    });
});
