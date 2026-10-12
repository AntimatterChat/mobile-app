// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Node} from 'commonmark';

import {findTimestamps} from '@utils/dynamic_timestamp';
import {findWalltimes, type Zone} from '@utils/walltime';

// Antimatter's markdown extensions, as Fusion renders them:
// - "<t:1700000000:R>", a dynamic timestamp, shown in the reader's time zone and format (am_timestamp nodes);
// - times written in messages, such as "3pm CET", shown in the reader's time zone too (am_walltime nodes);
// - "-# " at the start of a line, subtext: the rest of the line is small and muted (SUBTEXT_NODE nodes).

// Commonmark only walks into the container nodes it knows: custom_inline is the one it keeps for extensions.
export const SUBTEXT_NODE = 'custom_inline';

export type WalltimeContext = {

    // The author's time zone, which times without one are read in, if known.
    zone?: Zone;

    // When the message was posted: "tomorrow" is the day after.
    postedAt: number;
};

type Found = {index: number; text: string; node: Node};

/* eslint-disable @typescript-eslint/no-explicit-any */

function timestampNodes(text: string): Found[] {
    return findTimestamps(text).map((t) => {
        const node: any = new Node('am_timestamp' as any);
        node.literal = t.text;
        node.seconds = t.seconds;
        node.timestampStyle = t.style;
        return {index: t.index, text: t.text, node};
    });
}

function walltimeNodes(text: string, offset: number, walltime: WalltimeContext): Found[] {
    return findWalltimes(text, walltime.zone, walltime.postedAt).map((w) => {
        const node: any = new Node('am_walltime' as any);
        node.literal = w.text;
        node.start = w.start;
        node.end = w.end;
        node.zone = w.zone;
        node.explicit = w.explicit;
        return {index: offset + w.index, text: w.text, node};
    });
}

// findSpecial finds the timestamps of a text, and its walltimes between them.
function findSpecial(text: string, walltime?: WalltimeContext): Found[] {
    const timestamps = timestampNodes(text);
    if (!walltime) {
        return timestamps;
    }
    const found: Found[] = [];
    let from = 0;
    for (const t of [...timestamps, undefined]) {
        const to = t ? t.index : text.length;
        found.push(...walltimeNodes(text.slice(from, to), from, walltime));
        if (t) {
            found.push(t);
            from = t.index + t.text.length;
        }
    }
    return found;
}

function textNode(literal: string) {
    const node = new Node('text');
    node.literal = literal;
    return node;
}

// formatTimes turns the dynamic timestamps, and the walltimes when walltime is given, of the text nodes into their
// own nodes. Code isn't text: what's in it stays as written.
function formatTimes(ast: Node, walltime?: WalltimeContext) {
    const texts: Node[] = [];
    const walker = ast.walker();
    for (let e = walker.next(); e; e = walker.next()) {
        if (e.entering && e.node.type === 'text' && e.node.literal) {
            texts.push(e.node);
        }
    }

    for (const node of texts) {
        const literal = node.literal ?? '';
        const found = findSpecial(literal, walltime);
        if (!found.length) {
            continue;
        }
        let at = 0;
        for (const f of found) {
            if (f.index > at) {
                node.insertBefore(textNode(literal.slice(at, f.index)));
            }
            node.insertBefore(f.node);
            at = f.index + f.text.length;
        }
        if (at < literal.length) {
            node.insertBefore(textNode(literal.slice(at)));
        }
        node.unlink();
    }
}

const SUBTEXT_MARK = '-# ';
const isBreak = (node: Node) => node.type === 'softbreak' || node.type === 'linebreak';

// markSubtext wraps the lines of paragraphs that start with "-# " in subtext nodes, without the "-# ".
function markSubtext(ast: Node) {
    const paragraphs: Node[] = [];
    const walker = ast.walker();
    for (let e = walker.next(); e; e = walker.next()) {
        if (e.entering && e.node.type === 'paragraph') {
            paragraphs.push(e.node);
        }
    }

    for (const paragraph of paragraphs) {
        let lineStart = true;
        let child = paragraph.firstChild;
        while (child) {
            if (lineStart && child.type === 'text' && child.literal?.startsWith(SUBTEXT_MARK)) {
                child.literal = child.literal.slice(SUBTEXT_MARK.length);
                const subtext = new Node(SUBTEXT_NODE);
                child.insertBefore(subtext);
                let inLine: Node | null = child;
                while (inLine && !isBreak(inLine)) {
                    const next: Node | null = inLine.next;
                    subtext.appendChild(inLine);
                    inLine = next;
                }
                child = inLine;
                continue;
            }
            lineStart = isBreak(child);
            child = child.next;
        }
    }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export function applyAntimatterSyntax(ast: Node, walltime?: WalltimeContext): Node {
    markSubtext(ast);
    formatTimes(ast, walltime);
    return ast;
}
