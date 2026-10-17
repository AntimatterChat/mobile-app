// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {Post, Screens} from '@constants';
import {renderWithEverything, screen} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import {SystemMessage} from './system_message';

import type {Database} from '@nozbe/watermelondb';

jest.mock('@react-native-clipboard/clipboard', () => ({}));

// A moved thread leaves a pointer in the old place and a note in the new one, shown in the reader's language from
// their TranslationID, whatever language the server wrote them in.
describe('move thread system messages', () => {
    let database: Database;
    beforeAll(async () => {
        const server = await TestHelper.setupServerDatabase();
        database = server.database;
    });

    const render = (props: Record<string, unknown>, message = 'Ein Thread wurde verschoben') => renderWithEverything(
        <SystemMessage
            post={TestHelper.fakePostModel({type: Post.POST_TYPES.WRANGLER, message, props})}
            location={Screens.CHANNEL}
            hideGuestTags={false}
        />,
        {database},
    );

    it('should show the pointer to a moved thread, with its count and permalink', () => {
        render({
            TranslationID: 'app.post.move_thread_command.channel.multiple_messages',
            MovedThreadPermalink: 'https://chat.example.com/team/pl/abc123',
            NumMessages: 3,
        });

        expect(screen.getByText(/^A thread with 3 messages has been moved: /)).toBeTruthy();
        expect(screen.getByText('https://chat.example.com/team/pl/abc123')).toBeTruthy();
        expect(screen.queryByText(/Ein Thread/)).toBeNull();
    });

    it('should show the pointer to a single moved message', () => {
        render({
            TranslationID: 'app.post.move_thread_command.channel.one_message',
            MovedThreadPermalink: 'https://chat.example.com/team/pl/abc123',
            NumMessages: 1,
        });

        expect(screen.getByText(/^A message has been moved: /)).toBeTruthy();
        expect(screen.getByText('https://chat.example.com/team/pl/abc123')).toBeTruthy();
    });

    it('should show the note in the channel the thread moved to', () => {
        render({TranslationID: 'app.post.move_thread.from_another_channel'});

        expect(screen.getByText('This thread was moved from another channel')).toBeTruthy();
    });

    it('should show the server\'s words for a message it doesn\'t know, or a pointer without its link', () => {
        const {unmount} = render({TranslationID: 'app.post.move_thread_command.something_new'});
        expect(screen.getByText('Ein Thread wurde verschoben')).toBeTruthy();
        unmount();

        render({TranslationID: 'app.post.move_thread_command.channel.multiple_messages', NumMessages: 3});
        expect(screen.getByText('Ein Thread wurde verschoben')).toBeTruthy();
    });
});
