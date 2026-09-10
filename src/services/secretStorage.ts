import * as vscode from 'vscode';

const SECRET_KEY = 'studentExplainer.openRouterApiKey';

export class SecretStorageService {
  constructor(private readonly context: vscode.ExtensionContext) { }

  public async getApiKey(): Promise<string | undefined> {
    return await this.context.secrets.get(SECRET_KEY);
  }

  public async setApiKey(): Promise<void> {
    const inputKey = await vscode.window.showInputBox({
      prompt: 'Enter your OpenRouter API Key',
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => (value.trim() ? null : 'API key cannot be empty.')
    });

    if (inputKey) {
      await this.context.secrets.store(SECRET_KEY, inputKey.trim());
      vscode.window.showInformationMessage('OpenRouter API key stored securely.');
    }
  }

  public async deleteApiKey(): Promise<void> {
    await this.context.secrets.delete(SECRET_KEY);
    vscode.window.showInformationMessage('OpenRouter API key removed.');
  }
}
