import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { FunctionCodeLensProvider } from '../../src/providers/codeLensProvider';
import { TreeSitterExtractor } from '../../src/core/astExtractor';

suite('FunctionCodeLensProvider Test Suite', () => {
    let sandbox: sinon.SinonSandbox;
    let mockExtractor: sinon.SinonStubbedInstance<TreeSitterExtractor>;
    let provider: FunctionCodeLensProvider;

    setup(() => {
        sandbox = sinon.createSandbox();
        mockExtractor = sandbox.createStubInstance(TreeSitterExtractor);
        provider = new FunctionCodeLensProvider(
            mockExtractor as unknown as TreeSitterExtractor,
            vscode.Uri.file('/fake/path')
        );
    });

    teardown(() => {
        sandbox.restore();
        provider.dispose();
    });

    test('provideCodeLenses returns empty array when setting is disabled', async () => {
        const configStub = sandbox.stub(vscode.workspace, 'getConfiguration');
        configStub.returns({
            get: (key: string, defaultValue: any) => (key === 'enableCodeLens' ? false : defaultValue)
        } as any);

        const doc = { languageId: 'typescript', uri: vscode.Uri.file('test.ts') } as vscode.TextDocument;
        const lenses = await provider.provideCodeLenses(doc, new vscode.CancellationTokenSource().token);

        assert.deepStrictEqual(lenses, []);
    });

    test('provideCodeLenses exits early when cancellation token is requested', async () => {
        mockExtractor.initParser.resolves(true);
        const tokenSource = new vscode.CancellationTokenSource();
        tokenSource.cancel();

        const doc = { languageId: 'typescript', uri: vscode.Uri.file('test.ts') } as vscode.TextDocument;
        const lenses = await provider.provideCodeLenses(doc, tokenSource.token);

        assert.deepStrictEqual(lenses, []);
    });

    test('CodeLens passes the complete code range and function name', async () => {
        mockExtractor.initParser.resolves(true);
        const codeRange = new vscode.Range(0, 0, 2, 1);
        mockExtractor.getFunctionLocations.returns([{
            name: 'calculate',
            range: new vscode.Range(0, 0, 0, 9),
            codeRange
        }]);
        const doc = { languageId: 'typescript', uri: vscode.Uri.file('test.ts') } as vscode.TextDocument;

        const lenses = await provider.provideCodeLenses(doc, new vscode.CancellationTokenSource().token);
        const command = lenses[0].command;

        assert.deepStrictEqual(command?.arguments, [doc.uri, new vscode.Position(0, 0), codeRange, 'calculate']);
    });
});
