import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Activation Integration Test Suite', () => {
    vscode.window.showInformationMessage('Starting integration tests...');

    test('Extension should be present in context', () => {
        // Replace publisher.extension-name with your package.json identifier if updated
        const extension = vscode.extensions.getExtension('local-dev.student-explainer');
        assert.ok(extension, 'Extension should be registered');
    });

    test('Extension should activate successfully', async () => {
        const extension = vscode.extensions.getExtension('local-dev.student-explainer');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
        assert.strictEqual(extension?.isActive, true);
    });

    test('Registered commands should exist in VS Code registry', async () => {
        const commands = await vscode.commands.getCommands(true);

        assert.ok(
            commands.includes('studentExplainer.setApiKey'),
            'Command studentExplainer.setApiKey should be registered'
        );
        assert.ok(
            commands.includes('studentExplainer.explainAtPosition'),
            'Command studentExplainer.explainAtPosition should be registered'
        );
    });
});