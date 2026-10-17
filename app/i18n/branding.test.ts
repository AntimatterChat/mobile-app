// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Branding: the app says Antimatter, never Mattermost, in every language. This test fails when en.json mentions
// Mattermost outside the allowlist below, or when a translation mentions Mattermost (in any spelling) where en.json
// doesn't: a stale translation from Mattermost's catalogs, to reword with Antimatter or to delete so the translation
// pipeline redoes it. As the web app's webapp/fusion/src/i18n/branding.test.ts.

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const I18N = path.join(ROOT, 'assets/base/i18n');

// Mattermost, as the translations write it: in Latin letters (and a typo), Korean, Japanese, Persian and Nepali.
const MATTERMOST = /matt?t?ermost|매터모스트|マターモスト|مترموست|म्याटरमोस्ट/i;

// Strings of en.json allowed to name Mattermost, and why.
const ALLOWED: Record<string, string> = {

    // Legal notice: Antimatter is based on Mattermost.
    'settings.about.copyright': 'copyright credit to Mattermost, Inc.',
};

const readCatalog = (file: string): Record<string, unknown> => JSON.parse(fs.readFileSync(path.join(I18N, file), 'utf8'));

const en = readCatalog('en.json') as Record<string, string>;
const locales = fs.readdirSync(I18N).filter((f) => f.endsWith('.json') && f !== 'en.json');

describe('branding: the app says Antimatter, not Mattermost', () => {
    test('the spellings are found', () => {
        for (const text of ['Mattermost', 'mattermost.com', 'Matttermost를', '매터모스트', 'マターモスト', 'مترموست', 'म्याटरमोस्ट']) {
            expect(MATTERMOST.test(text)).toBe(true);
        }
        expect(MATTERMOST.test('Antimatter')).toBe(false);
    });

    test('en.json only mentions Mattermost in allowlisted strings', () => {
        const offending = Object.entries(en).
            filter(([id, text]) => MATTERMOST.test(text) && !(id in ALLOWED)).
            map(([id, text]) => `${id}: ${text}`);

        expect(offending).toEqual([]);
    });

    test('the allowlist has no stale entries', () => {
        const stale = Object.keys(ALLOWED).filter((id) => !(id in en) || !MATTERMOST.test(en[id]));

        expect(stale).toEqual([]);
    });

    test('there are translations to check', () => {
        expect(locales.length).toBeGreaterThan(30);
    });

    test.each(locales)('%s only mentions Mattermost where en.json does', (file) => {
        const offending = Object.entries(readCatalog(file)).
            filter(([id, text]) => typeof text === 'string' && MATTERMOST.test(text) && !(id in en && MATTERMOST.test(en[id]))).
            map(([id, text]) => `${id}: ${text}`);

        expect(offending).toEqual([]);
    });
});

// The app's code and its beta builds: no links to Mattermost's sites, nor its name where users see it. (The
// "Mattermost Mobile/" user agent and the mattermost:// scheme stay: servers and links depend on them.)
describe('branding: outside the translations', () => {
    function sourceFiles(dir: string, out: string[] = []): string[] {
        for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
            const p = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name !== 'node_modules' && entry.name !== '__snapshots__') {
                    sourceFiles(p, out);
                }
            } else if ((/\.(tsx?|jsx?)$/).test(entry.name) && !entry.name.includes('test')) {
                out.push(p);
            }
        }
        return out;
    }

    test('the code links to no mattermost.com site', () => {
        const offending = [...sourceFiles(path.join(ROOT, 'app')), ...sourceFiles(path.join(ROOT, 'share_extension'))].
            filter((file) => (/\bmattermost\.com\b/i).test(fs.readFileSync(file, 'utf8'))).
            map((file) => path.relative(ROOT, file));

        expect(offending).toEqual([]);
    });

    test('over-the-air beta installs are titled Antimatter Beta', () => {
        const plist = fs.readFileSync(path.join(ROOT, 'fastlane/plist.erb'), 'utf8');

        expect(plist).toContain('<string>Antimatter Beta</string>');
        expect(plist).not.toMatch(MATTERMOST);
    });
});
