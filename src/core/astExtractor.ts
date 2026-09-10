import * as vscode from 'vscode';

export interface FunctionLocation {
    name: string;
    range: vscode.Range;
    codeRange: vscode.Range;
}

export class TreeSitterExtractor {
    private isInitialized = false;

    public async initParser(extensionUri: vscode.Uri, languageId: string): Promise<boolean> {
        const supportedLanguages = ['typescript', 'javascript', 'java', 'cpp'];
        if (!supportedLanguages.includes(languageId)) {
            return false;
        }
        this.isInitialized = true;
        return true;
    }

    public getFunctionLocations(document: vscode.TextDocument): FunctionLocation[] {
        if (!this.isInitialized) {
            return [];
        }

        const locations: FunctionLocation[] = [];
        const text = document.getText();
        const searchableText = this.maskNonCode(text);
        const regex = /(?:function\s+([A-Za-z_$][\w$]*)|([A-Za-z_$][\w$]*))\s*\([^)]*\)\s*\{/g;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(searchableText)) !== null) {
            const name = match[1] || match[2];
            if (!name || ['if', 'for', 'while', 'switch', 'catch', 'with'].includes(name)) {
                continue;
            }

            const nameOffset = match.index + match[0].indexOf(name);
            const openingBraceOffset = match.index + match[0].lastIndexOf('{');
            const closingBraceOffset = this.findMatchingBrace(searchableText, openingBraceOffset);
            if (closingBraceOffset < 0) {
                continue;
            }

            const nameStart = document.positionAt(nameOffset);
            const nameEnd = document.positionAt(nameOffset + name.length);
            const codeStart = document.positionAt(match.index);
            const codeEnd = document.positionAt(closingBraceOffset + 1);
            locations.push({
                name,
                range: new vscode.Range(nameStart, nameEnd),
                codeRange: new vscode.Range(codeStart, codeEnd)
            });
        }

        return locations;
    }

    private findMatchingBrace(text: string, openingBraceOffset: number): number {
        let depth = 0;
        for (let index = openingBraceOffset; index < text.length; index++) {
            if (text[index] === '{') {
                depth++;
            } else if (text[index] === '}' && --depth === 0) {
                return index;
            }
        }
        return -1;
    }

    private maskNonCode(text: string): string {
        let result = '';
        let state: 'code' | 'lineComment' | 'blockComment' | 'singleQuote' | 'doubleQuote' | 'template' = 'code';

        for (let index = 0; index < text.length; index++) {
            const current = text[index];
            const next = text[index + 1];

            if (state === 'code') {
                if (current === '/' && next === '/') {
                    result += '  ';
                    index++;
                    state = 'lineComment';
                } else if (current === '/' && next === '*') {
                    result += '  ';
                    index++;
                    state = 'blockComment';
                } else if (current === "'") {
                    result += ' ';
                    state = 'singleQuote';
                } else if (current === '"') {
                    result += ' ';
                    state = 'doubleQuote';
                } else if (current === '`') {
                    result += ' ';
                    state = 'template';
                } else {
                    result += current;
                }
            } else if (state === 'lineComment') {
                result += current === '\n' ? '\n' : ' ';
                if (current === '\n') state = 'code';
            } else if (state === 'blockComment') {
                result += current === '\n' ? '\n' : ' ';
                if (current === '*' && next === '/') {
                    result += ' ';
                    index++;
                    state = 'code';
                }
            } else {
                result += current === '\n' ? '\n' : ' ';
                if (current === '\\') {
                    result += next === '\n' ? '\n' : ' ';
                    index++;
                } else if (
                    (state === 'singleQuote' && current === "'") ||
                    (state === 'doubleQuote' && current === '"') ||
                    (state === 'template' && current === '`')
                ) {
                    state = 'code';
                }
            }
        }

        return result;
    }
}
