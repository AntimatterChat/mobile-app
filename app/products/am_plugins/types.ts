// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// The shapes of the Antimatter plugins' REST APIs the app uses.

export type PollOption = {
    text: string;
    votes: number;

    // Who voted for the answer, unless the poll is anonymous
    voters?: string[];
};

// A poll as the server shows it to the user (polls plugin, PollView)
export type Poll = {
    id: string;
    post_id: string;
    channel_id: string;
    creator_id: string;
    question: string;
    options: PollOption[];
    multi: boolean;
    anonymous: boolean;
    create_at: number;
    end_at?: number;
    closed_at?: number;
    closed: boolean;
    voter_count: number;

    // The answers the user voted for
    my_votes: number[];
};

export type PollRequest = {
    channel_id: string;
    root_id?: string;
    question: string;
    options: string[];
    multi: boolean;
    anonymous: boolean;
    duration_minutes: number;
};

// A note or whiteboard (notes and whiteboard plugins)
export type PluginDoc = {
    id: string;
    title: string;
    channel_id: string;
    creator_id: string;
    create_at: number;
    update_at: number;
    shared_post_id?: string;
};

export type TodoItem = {
    id: string;
    message: string;
};

// The user's personal todo lists (todo plugin, GET /lists)
export type TodoLists = {
    my?: TodoItem[];
    in?: TodoItem[];
    out?: TodoItem[];
};

export type TodoAction = 'accept' | 'complete' | 'remove';

export type GifKind = 'gif' | 'sticker';

export type GifMedia = {
    url: string;
    width?: number;
    height?: number;
    video?: boolean;
};

// A GIF or sticker (gifs plugin)
export type GifItem = {
    id: string;
    kind: GifKind;
    title?: string;
    description?: string;
    preview: GifMedia;
    post: GifMedia;
    image?: GifMedia;
    still?: GifMedia;
    attribution?: string;
    source_url?: string;
};

export type GifPage = {
    items: GifItem[];
    next?: string;
};

export type GifsConfig = {
    configured: boolean;
    stickers: boolean;
};
