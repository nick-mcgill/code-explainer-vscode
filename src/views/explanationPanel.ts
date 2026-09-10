import * as vscode from 'vscode';
import { randomBytes } from 'crypto';

export class ExplanationPanel {
  public static currentPanel: ExplanationPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private pendingMessages: Array<{ command: string; text?: string }> = [];
  private webviewReady = false;
  private disposed = false;

  private constructor(panel: vscode.WebviewPanel) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.disposables.push(
      this.panel.webview.onDidReceiveMessage((message) => {
        if (message.command !== 'ready') {
          return;
        }

        this.webviewReady = true;
        const pendingMessages = this.pendingMessages;
        this.pendingMessages = [];
        for (const pendingMessage of pendingMessages) {
          void this.panel.webview.postMessage(pendingMessage);
        }
      })
    );
  }

  public static createOrShow(extensionUri: vscode.Uri): ExplanationPanel {
    if (ExplanationPanel.currentPanel) {
      ExplanationPanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside);
      return ExplanationPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      'studentExplainerView',
      'AI Code Explanation',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
      }
    );

    ExplanationPanel.currentPanel = new ExplanationPanel(panel);
    return ExplanationPanel.currentPanel;
  }

  public updateContent(initialText: string = ''): void {
    const webview = this.panel.webview;
    const nonce = this.getNonce();
    const safeInitialText = this.escapeHtml(initialText);
    this.webviewReady = false;
    this.pendingMessages = [];

    webview.html = `<!DOCTYPE html>
                                                                                                                              <html lang="en">
                                                                                                                              <head>
                                                                                                                                <meta charset="UTF-8">
                                                                                                                                  <meta http-equiv="Content-Security-Policy" 
                                                                                                                                          content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                                                                                                                                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                                                                                                                              <title>Explanation</title>
                                                                                                                                                <style>
                                                                                                                                                    body { font-family: var(--vscode-font-family); padding: 1rem; color: var(--vscode-editor-foreground); }
                                                                                                                                                        pre { background: var(--vscode-textCodeBlock-background); padding: 0.5rem; border-radius: 4px; }
                                                                                                                                                          </style>
                                                                                                                                                          </head>
                                                                                                                                                          <body>
                                                                                                                                                            <div id="content">${safeInitialText}</div>
                                                                                                                                                              <script nonce="${nonce}">
                                                                                                                                                                  const vscode = acquireVsCodeApi();
                                                                                                                                                                      const contentDiv = document.getElementById('content');
                                                                                                                                                                          
                                                                                                                                                                                                window.addEventListener('message', event => {
                                                                                                                                                                                                      const message = event.data;
                                                                                                                                                                                                            if (message.command === 'appendChunk') {
                                                                                                                                                                                                                        contentDiv.textContent += message.text;
                                                                                                                                                                                                                                  } else if (message.command === 'clear') {
                                                                                                                                                                                                                            contentDiv.textContent = '';
                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                            });
                                                                                                                                                                                                                                                               vscode.postMessage({ command: 'ready' });
                                                                                                                                                                                                                                                              </script>
                                                                                                                                                                                                                                                              </body>
                                                                                                                                                                                                                                                              </html>`;
  }

  public appendStreamChunk(text: string): void {
    this.sendMessage({ command: 'appendChunk', text });
  }

  public clear(): void {
    this.sendMessage({ command: 'clear' });
  }

  private sendMessage(message: { command: string; text?: string }): void {
    if (!this.webviewReady) {
      this.pendingMessages.push(message);
      return;
    }

    void this.panel.webview.postMessage(message);
  }

  private getNonce(): string {
    return randomBytes(16).toString('hex');
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      };
      return entities[character];
    });
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    ExplanationPanel.currentPanel = undefined;
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.panel.dispose();
  }
}
