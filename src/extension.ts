import * as vscode from 'vscode';
import { SecretStorageService } from './services/secretStorage';
import { TreeSitterExtractor } from './core/astExtractor';
import { FunctionCodeLensProvider } from './providers/codeLensProvider';
import { OpenRouterFreeHarness } from './core/harness';
import { ExplanationPanel } from './views/explanationPanel';

export async function activate(context: vscode.ExtensionContext) {
        const secretService = new SecretStorageService(context);
        const astExtractor = new TreeSitterExtractor();
        const harness = new OpenRouterFreeHarness();

        const codeLensProvider = new FunctionCodeLensProvider(astExtractor, context.extensionUri);
        context.subscriptions.push(
                vscode.languages.registerCodeLensProvider(
                        [
                                { scheme: 'file', language: 'typescript' },
                                { scheme: 'file', language: 'javascript' },
                                { scheme: 'file', language: 'java' },
                                { scheme: 'file', language: 'cpp' }
                        ],
                        codeLensProvider
                )
        );

        context.subscriptions.push(
                vscode.commands.registerCommand('studentExplainer.setApiKey', async () => {
                        await secretService.setApiKey();
                }),

                vscode.commands.registerCommand(
                        'studentExplainer.explainAtPosition',
                        async (uri: vscode.Uri, position: vscode.Position) => {
                                const apiKey = await secretService.getApiKey();
                                if (!apiKey) {
                                        const setKey = 'Set API Key';
                                        const choice = await vscode.window.showErrorMessage('OpenRouter API Key missing.', setKey);
                                        if (choice === setKey) {
                                                await secretService.setApiKey();
                                        }
                                        return;
                                }

                                const editor = vscode.window.activeTextEditor;
                                if (!editor) {
                                        return;
                                }

                                const document = editor.document;
                                const wordRange = document.getWordRangeAtPosition(position);
                                if (!wordRange) {
                                        return;
                                }

                                const functionCode = document.getText(wordRange);
                                if (functionCode.length > 1000) {
                                        vscode.window.showWarningMessage('Selected code block exceeds the 1,000 character limit.');
                                        return;
                                }

                                const panel = ExplanationPanel.createOrShow(context.extensionUri);
                                panel.updateContent('<em>Generating explanation...</em>');

                                try {
                                        panel.clear();
                                        await harness.generateExplanationStream(
                                                apiKey,
                                                `Explain this code for a student:\n\n${functionCode}`,
                                                (chunk) => panel.appendStreamChunk(chunk)
                                        );
                                } catch (err: any) {
                                        vscode.window.showErrorMessage(`Explanation failed: ${err.message}`);
                                }
                        }
                )
        );
}

export function deactivate() { }
