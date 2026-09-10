import * as vscode from 'vscode';

export class ExplanationPanel {
  public static currentPanel: ExplanationPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
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
                                                                                                                                                            <div id="content">${initialText}</div>
                                                                                                                                                              <script nonce="${nonce}">
                                                                                                                                                                  const vscode = acquireVsCodeApi();
                                                                                                                                                                      const contentDiv = document.getElementById('content');
                                                                                                                                                                          
                                                                                                                                                                              const previousState = vscode.getState();
                                                                                                                                                                                  if (previousState && previousState.text) {
                                                                                                                                                                                        contentDiv.innerHTML = previousState.text;
                                                                                                                                                                                            }

                                                                                                                                                                                                window.addEventListener('message', event => {
                                                                                                                                                                                                      const message = event.data;
                                                                                                                                                                                                            if (message.command === 'appendChunk') {
                                                                                                                                                                                                                    contentDiv.innerHTML += message.text;
                                                                                                                                                                                                                            vscode.setState({ text: contentDiv.innerHTML });
                                                                                                                                                                                                                                  } else if (message.command === 'clear') {
                                                                                                                                                                                                                                          contentDiv.innerHTML = '';
                                                                                                                                                                                                                                                  vscode.setState({ text: '' });
                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                            });
                                                                                                                                                                                                                                                              </script>
                                                                                                                                                                                                                                                              </body>
                                                                                                                                                                                                                                                              </html>`;
  }

  public appendStreamChunk(text: string): void {
    this.panel.webview.postMessage({ command: 'appendChunk', text });
  }

  public clear(): void {
    this.panel.webview.postMessage({ command: 'clear' });
  }

  private getNonce(): string {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  public dispose(): void {
    ExplanationPanel.currentPanel = undefined;
    this.panel.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}
