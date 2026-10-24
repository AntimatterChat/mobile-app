// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {parseAssistantResult} from './result_attachments';

describe('parseAssistantResult', () => {
    it('returns null for plain text', () => {
        expect(parseAssistantResult('www-1 CPU, last hour: 23% average')).toBeNull();
    });

    it('returns null for undefined', () => {
        expect(parseAssistantResult(undefined)).toBeNull();
    });

    it('returns null for JSON without summary or attachments', () => {
        expect(parseAssistantResult(JSON.stringify({foo: 'bar'}))).toBeNull();
    });

    it('returns the summary alone', () => {
        const result = parseAssistantResult(JSON.stringify({summary: 'CPU on www-1: 4% now'}));
        expect(result).toEqual({summary: 'CPU on www-1: 4% now', attachments: undefined});
    });

    it('returns validated attachments with the summary', () => {
        const attachments = [{
            fallback: 'CPU on www-1: 4% now, 6% peak in the last hour',
            color: '#3E8EDE',
            title: 'CPU on www-1 (last hour)',
            text: '4.1% now · peak 5.8% · average 3.8%',
            chart: {values: [3.1, 3.4, 4.0, 4.1], threshold: 80, label: 'CPU %'},
        }];
        const result = parseAssistantResult(JSON.stringify({attachments, summary: 'CPU on www-1: 4% now'}));
        expect(result?.summary).toBe('CPU on www-1: 4% now');
        expect(result?.attachments).toEqual(attachments);
    });

    it('drops actions from attachments', () => {
        const attachments = [{
            text: 'Deploy?',
            actions: [{id: 'a1', name: 'Approve', type: 'button'}],
        }];
        const result = parseAssistantResult(JSON.stringify({attachments, summary: 'Deploy pending'}));
        expect(result?.attachments?.[0].actions).toBeUndefined();
    });

    it('ignores an attachments field that is not a valid attachment array', () => {
        const result = parseAssistantResult(JSON.stringify({attachments: 'nope', summary: 'Still a summary'}));
        expect(result).toEqual({summary: 'Still a summary', attachments: undefined});
    });

    it('returns null for malformed JSON', () => {
        expect(parseAssistantResult('{not json')).toBeNull();
    });
});
