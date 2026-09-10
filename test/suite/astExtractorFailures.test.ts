import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { TreeSitterExtractor } from '../../src/core/astExtractor';

suite('TreeSitterExtractor Failure Paths Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  let extractor: TreeSitterExtractor;

  setup(() => {
    sandbox = sinon.createSandbox();
    extractor = new TreeSitterExtractor();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('initParser returns false for unsupported language ID', async () => {
    const result = await extractor.initParser(
      vscode.Uri.file('/fake'),
      'unsupported_language_123'
    );
    assert.strictEqual(result, false);
  });

  test('getFunctionLocations handles uninitialized parser safely', async () => {
    const doc = await vscode.workspace.openTextDocument({
      language: 'java',
      content: 'class Test { void main() {} }'
    });

    const locations = extractor.getFunctionLocations(doc);
    assert.deepStrictEqual(locations, []);
  });
});
