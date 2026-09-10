import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { SecretStorageService } from '../../src/services/secretStorage';

suite('SecretStorageService Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  let secretMap: Map<string, string>;
  let mockContext: vscode.ExtensionContext;
  let service: SecretStorageService;

  setup(() => {
    sandbox = sinon.createSandbox();
    secretMap = new Map();

    mockContext = {
      secrets: {
        get: sandbox.stub().callsFake(async (key: string) => secretMap.get(key)),
        store: sandbox.stub().callsFake(async (key: string, val: string) => { secretMap.set(key, val); }),
        delete: sandbox.stub().callsFake(async (key: string) => { secretMap.delete(key); }),
        onDidChange: new vscode.EventEmitter<vscode.SecretStorageChangeEvent>().event
      }
    } as unknown as vscode.ExtensionContext;

    service = new SecretStorageService(mockContext);
  });

  teardown(() => {
    sandbox.restore();
  });

  test('getApiKey should return undefined when no key is stored', async () => {
    const key = await service.getApiKey();
    assert.strictEqual(key, undefined);
  });

  test('getApiKey should return stored key when present', async () => {
    secretMap.set('studentExplainer.openRouterApiKey', 'sk-or-v1-testkey');
    const key = await service.getApiKey();
    assert.strictEqual(key, 'sk-or-v1-testkey');
  });

  test('setApiKey should prompt user and store trimmed key', async () => {
    sandbox.stub(vscode.window, 'showInputBox').resolves('  sk-or-v1-newkey  ');
    await service.setApiKey();
    assert.strictEqual(secretMap.get('studentExplainer.openRouterApiKey'), 'sk-or-v1-newkey');
  });

  test('deleteApiKey should remove key from secret storage', async () => {
    secretMap.set('studentExplainer.openRouterApiKey', 'sk-or-v1-testkey');
    await service.deleteApiKey();
    assert.strictEqual(secretMap.get('studentExplainer.openRouterApiKey'), undefined);
  });
});
