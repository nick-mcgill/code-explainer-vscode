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

  test('getFunctionLocations returns complete function ranges and ignores comments and strings', async () => {
    await extractor.initParser(vscode.Uri.file('/fake'), 'typescript');
    const source = `// function fake() {}
const text = "function alsoFake() {}";
function real(value: number) {
  if (value) {
    return value + 1;
  }
}`;
    const doc = await vscode.workspace.openTextDocument({ language: 'typescript', content: source });

    const locations = extractor.getFunctionLocations(doc);

    assert.strictEqual(locations.length, 1);
    assert.strictEqual(locations[0].name, 'real');
    assert.strictEqual(doc.getText(locations[0].codeRange), source.slice(source.indexOf('function real'), source.length));
  });
});
