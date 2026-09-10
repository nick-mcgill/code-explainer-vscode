import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { ExplanationPanel } from '../../src/views/explanationPanel';

suite('ExplanationPanel Test Suite', () => {
    let sandbox: sinon.SinonSandbox;
    let mockWebviewPanel: any;
    let mockWebview: any;

    setup(() => {
        sandbox = sinon.createSandbox();
        mockWebview = {
            cspSource: 'vscode-webview:',
            html: '',
            postMessage: sandbox.stub().resolves(true)
        };
        mockWebviewPanel = {
            webview: mockWebview,
            reveal: sandbox.stub(),
            onDidDispose: sandbox.stub(),
            dispose: sandbox.stub()
        };
        sandbox.stub(vscode.window, 'createWebviewPanel').returns(mockWebviewPanel);
    });

    teardown(() => {
        sandbox.restore();
        if (ExplanationPanel.currentPanel) {
            ExplanationPanel.currentPanel.dispose();
        }
    });

    test('createOrShow instantiates WebviewPanel with retainContextWhenHidden', () => {
        const panel = ExplanationPanel.createOrShow(vscode.Uri.file('/fake'));
        assert.ok(panel);
        assert.ok((vscode.window.createWebviewPanel as sinon.SinonStub).calledOnce);

        const options = (vscode.window.createWebviewPanel as sinon.SinonStub).firstCall.args[3];
        assert.strictEqual(options.retainContextWhenHidden, true);
        assert.strictEqual(options.enableScripts, true);
    });

    test('createOrShow reuses existing panel if open', () => {
        const panel1 = ExplanationPanel.createOrShow(vscode.Uri.file('/fake'));
        const panel2 = ExplanationPanel.createOrShow(vscode.Uri.file('/fake'));

        assert.strictEqual(panel1, panel2);
        assert.ok(mockWebviewPanel.reveal.calledOnce);
    });

    test('updateContent injects HTML with Content-Security-Policy and Nonce', () => {
        const panel = ExplanationPanel.createOrShow(vscode.Uri.file('/fake'));
        panel.updateContent('Sample explanation payload');

        assert.ok(mockWebview.html.includes('Content-Security-Policy'));
        assert.ok(mockWebview.html.includes('nonce-'));
        assert.ok(mockWebview.html.includes('Sample explanation payload'));
    });

    test('appendStreamChunk dispatches message to Webview', () => {
        const panel = ExplanationPanel.createOrShow(vscode.Uri.file('/fake'));
        panel.appendStreamChunk('Chunk data');

        assert.ok(
            mockWebview.postMessage.calledOnceWith({
                command: 'appendChunk',
                text: 'Chunk data'
            })
        );
    });

    test('escapes initial content before embedding it in webview HTML', () => {
        const panel = ExplanationPanel.createOrShow(vscode.Uri.file('/fake'));
        panel.updateContent('<img src=x onerror=alert(1)>');

        assert.ok(mockWebview.html.includes('&lt;img src=x onerror=alert(1)&gt;'));
        assert.ok(!mockWebview.html.includes('<img src=x onerror=alert(1)>'));
    });
});
