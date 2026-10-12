// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo} from 'react';

import {updateDraftBoRConfig, updateDraftPriority, updateDraftSpoiler} from '@actions/local/draft';
import SendDraft from '@components/draft_scheduled_post/draft_scheduled_post_actions/send_draft';
import DraftInput from '@components/post_draft/draft_input/';
import {PostPriorityType} from '@constants/post';
import {useServerUrl} from '@context/server';
import {useHandleSendMessage} from '@hooks/handle_send_message';
import {useInlineReply} from '@hooks/inline_reply';
import {inlineReplyProps} from '@utils/inline_reply';

import type {DraftType} from '@constants/draft';
import type CustomEmojiModel from '@typings/database/models/servers/custom_emoji';
import type {AvailableScreens} from '@typings/screens/navigation';

type Props = {
    testID?: string;
    channelId: string;
    channelType?: ChannelType;
    channelName?: string;
    rootId: string;
    canShowPostPriority?: boolean;
    setIsFocused: (isFocused: boolean) => void;

    // From database
    currentUserId: string;
    cursorPosition: number;
    enableConfirmNotificationsToChannel?: boolean;
    maxMessageLength: number;
    membersCount?: number;
    useChannelMentions: boolean;
    userIsOutOfOffice: boolean;
    customEmojis: CustomEmojiModel[];

    // DRAFT Handler
    value: string;
    files: FileInfo[];
    clearDraft: () => void;
    updateValue: React.Dispatch<React.SetStateAction<string>>;
    updateCursorPosition: React.Dispatch<React.SetStateAction<number>>;
    updatePostInputTop: (top: number) => void;
    addFiles: (file: FileInfo[]) => void;
    uploadFileError: React.ReactNode;
    persistentNotificationInterval: number;
    persistentNotificationMaxRecipients: number;
    postPriority: PostPriority;
    postBoRConfig?: PostBoRConfig;
    isSpoiler?: boolean;
    mentionQuotedAuthor?: boolean;

    draftType?: DraftType;
    postId?: string;
    channelDisplayName?: string;
    isFromDraftView?: boolean;
    draftReceiverUserName?: string;
    onPostCreated?: (postId: string) => void;
    location?: AvailableScreens;
}

export const INITIAL_PRIORITY = {
    priority: PostPriorityType.STANDARD,
    requested_ack: false,
    persistent_notifications: false,
};

export default function SendHandler({
    testID,
    channelId,
    channelType,
    channelName,
    channelDisplayName,
    currentUserId,
    enableConfirmNotificationsToChannel,
    files,
    maxMessageLength,
    membersCount = 0,
    cursorPosition,
    rootId,
    canShowPostPriority,
    useChannelMentions,
    userIsOutOfOffice,
    customEmojis,
    value,
    clearDraft,
    updateValue,
    addFiles,
    uploadFileError,
    updateCursorPosition,
    updatePostInputTop,
    setIsFocused,
    persistentNotificationInterval,
    persistentNotificationMaxRecipients,
    postPriority,
    draftReceiverUserName,
    isFromDraftView,
    draftType,
    postId,
    onPostCreated,
    postBoRConfig,
    isSpoiler = false,
    mentionQuotedAuthor = true,
    location,
}: Props) {
    const serverUrl = useServerUrl();

    const handlePostPriority = useCallback((priority: PostPriority) => {
        updateDraftPriority(serverUrl, channelId, rootId, priority);
    }, [serverUrl, channelId, rootId]);

    const handlePostBoRStatus = useCallback((config: PostBoRConfig) => {
        updateDraftBoRConfig(serverUrl, channelId, rootId, config);
    }, [channelId, rootId, serverUrl]);

    const handleSpoiler = useCallback((spoiler: boolean) => {
        updateDraftSpoiler(serverUrl, channelId, rootId, spoiler);
    }, [serverUrl, channelId, rootId]);

    // The message the draft replies to inline, if any.
    const [replyTo, setReplyTo] = useInlineReply(serverUrl, channelId, rootId);

    // The Antimatter props the draft is sent with.
    const postProps = useMemo(() => {
        if (!isSpoiler && !replyTo) {
            return undefined;
        }
        return {
            ...(isSpoiler ? {spoiler: true} : {}),
            ...(replyTo ? inlineReplyProps(replyTo, mentionQuotedAuthor) : {}),
        };
    }, [isSpoiler, replyTo, mentionQuotedAuthor]);

    // The drafts screen shows no reply bar: its drafts are sent as they show.
    const draftViewProps = useMemo(() => (isSpoiler ? {spoiler: true} : undefined), [isSpoiler]);

    // Once sent, the draft replies to nothing anymore.
    const clearDraftAndReply = useCallback(() => {
        clearDraft();
        setReplyTo('');
    }, [clearDraft, setReplyTo]);

    const {handleSendMessage, canSend} = useHandleSendMessage({
        value,
        channelId,
        rootId,
        files,
        maxMessageLength,
        customEmojis,
        enableConfirmNotificationsToChannel,
        useChannelMentions,
        membersCount,
        userIsOutOfOffice,
        currentUserId,
        channelType,
        postPriority,
        clearDraft: clearDraftAndReply,
        onPostCreated,
        postBoRConfig,
        postProps,
    });

    if (isFromDraftView) {
        return (
            <SendDraft
                channelId={channelId}
                rootId={rootId}
                channelType={channelType}
                currentUserId={currentUserId}
                channelName={channelName}
                channelDisplayName={channelDisplayName}
                enableConfirmNotificationsToChannel={enableConfirmNotificationsToChannel}
                maxMessageLength={maxMessageLength}
                membersCount={membersCount}
                useChannelMentions={useChannelMentions}
                userIsOutOfOffice={userIsOutOfOffice}
                customEmojis={customEmojis}
                value={value}
                files={files}
                postPriority={postPriority}
                persistentNotificationInterval={persistentNotificationInterval}
                persistentNotificationMaxRecipients={persistentNotificationMaxRecipients}
                draftReceiverUserName={draftReceiverUserName}
                draftType={draftType}
                postId={postId}
                postProps={draftViewProps}
            />
        );
    }

    return (
        <DraftInput
            testID={testID}
            channelId={channelId}
            channelType={channelType}
            channelName={channelName}
            currentUserId={currentUserId}
            rootId={rootId}
            canShowPostPriority={canShowPostPriority}
            cursorPosition={cursorPosition}
            updateCursorPosition={updateCursorPosition}
            value={value}
            files={files}
            updateValue={updateValue}
            addFiles={addFiles}
            uploadFileError={uploadFileError}
            sendMessage={handleSendMessage}
            canSend={canSend}
            maxMessageLength={maxMessageLength}
            updatePostInputTop={updatePostInputTop}
            postPriority={postPriority}
            postBoRConfig={postBoRConfig}
            updatePostPriority={handlePostPriority}
            updatePostBoRStatus={handlePostBoRStatus}
            isSpoiler={isSpoiler}
            updateSpoiler={handleSpoiler}
            persistentNotificationInterval={persistentNotificationInterval}
            persistentNotificationMaxRecipients={persistentNotificationMaxRecipients}
            setIsFocused={setIsFocused}
            location={location}
        />
    );
}
