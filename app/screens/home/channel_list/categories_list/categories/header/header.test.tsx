// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Database, Q} from '@nozbe/watermelondb';
import {act, fireEvent, screen} from '@testing-library/react-native';
import React from 'react';

import {toggleCollapseCategory} from '@actions/local/category';
import {saveServerCategoryCollapsed} from '@actions/remote/category';
import {MM_TABLES} from '@constants/database';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import CategoryHeader from './header';

import type CategoryModel from '@typings/database/models/servers/category';

jest.mock('@actions/local/category');
jest.mock('@actions/remote/category');

describe('components/channel_list/categories/header', () => {
    let database: Database;
    let category: CategoryModel;
    beforeAll(async () => {
        const server = await TestHelper.setupServerDatabase();

        database = server.database;
        const categories = await database.get<CategoryModel>(MM_TABLES.SERVER.CATEGORY).query(
            Q.take(1),
        ).fetch();

        category = categories[0];
    });

    // Skipping this test because the snapshot became too big and
    // it errors out.
    it.skip('should match snapshot', () => {
        const wrapper = renderWithIntlAndTheme(
            <CategoryHeader
                category={category}
                hasChannels={true}
            />,
        );
        expect(wrapper.toJSON()).toMatchSnapshot();
    });

    it('should mark a locked server category, and save the fold of a server category for the other apps', async () => {
        const managed = {id: 'mm_managed:team:Voice', teamId: 'team', displayName: 'Voice', type: 'custom', collapsed: false, muted: false} as CategoryModel;
        jest.mocked(toggleCollapseCategory).mockResolvedValue({category: {...managed, collapsed: true} as CategoryModel});

        renderWithIntlAndTheme(
            <CategoryHeader
                category={managed}
                hasChannels={true}
                managed={true}
                locked={true}
            />,
        );

        expect(screen.getByTestId('channel_list.category_header.custom.locked')).toBeTruthy();
        await act(async () => {
            fireEvent.press(screen.getByText('Voice'));
        });
        expect(saveServerCategoryCollapsed).toHaveBeenCalledWith(expect.any(String), 'team', 'Voice', true);
    });

    it('should not mark an open server category', () => {
        const managed = {id: 'mm_managed:team:Community', teamId: 'team', displayName: 'Community', type: 'custom', collapsed: false, muted: false} as CategoryModel;

        renderWithIntlAndTheme(
            <CategoryHeader
                category={managed}
                hasChannels={true}
                managed={true}
                locked={false}
            />,
        );

        expect(screen.queryByTestId('channel_list.category_header.custom.locked')).toBeNull();
    });

    it('should label the favourites category Favourites in English, whatever its stored name', () => {
        const favorites = {id: 'favorites_user_team', teamId: 'team', displayName: 'Favorites', type: 'favorites', collapsed: false, muted: false} as CategoryModel;

        renderWithIntlAndTheme(
            <CategoryHeader
                category={favorites}
                hasChannels={true}
            />,
        );

        expect(screen.getByTestId('channel_list.category_header.favorites.display_name')).toHaveTextContent('Favourites');
        expect(screen.queryByText('Favorites')).toBeNull();
    });
});
