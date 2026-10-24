// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {isMessageAttachmentArray} from '@utils/message_attachment';

// parseAssistantResult looks for the message-attachment result format described in
// ASSISTANT_DISPLAY.md: a tool's result text (AIToolResult.Text) may be a JSON object
// carrying `attachments`, the same format integrations already post (`props.attachments`,
// MessageAttachment in webapp/platform/types/src/message_attachments.ts), and a plain-text
// `summary` used for screen readers and as the card's subtitle. A tool that returns anything
// else, including plain text, keeps today's rendering (the raw text and, if it has a points
// line, a sparkline): extractDataPoints (sparkline_data.ts) still reads that.
export type AssistantResultAttachments = {
    summary?: string;
    attachments?: MessageAttachment[];
};

export function parseAssistantResult(result: string | undefined): AssistantResultAttachments | null {
    if (!result) {
        return null;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(result);
    } catch {
        return null;
    }

    if (typeof parsed !== 'object' || !parsed) {
        return null;
    }

    const obj = parsed as Record<string, unknown>;
    const summary = typeof obj.summary === 'string' ? obj.summary : undefined;
    const attachments = isMessageAttachmentArray(obj.attachments) ? dropActions(obj.attachments) : undefined;

    if (!summary && !attachments) {
        return null;
    }

    return {summary, attachments};
}

// dropActions removes any action buttons an attachment carries: ASSISTANT_DISPLAY.md says
// assistant results never have them ("No actions (buttons) in assistant results. Clients and
// the server drop them."), so a tool that includes some anyway has them stripped here too.
function dropActions(attachments: MessageAttachment[]): MessageAttachment[] {
    return attachments.map((attachment) => (attachment.actions ? {...attachment, actions: undefined} : attachment));
}
