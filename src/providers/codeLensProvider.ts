import * as vscode from 'vscode';
import { TreeSitterExtractor } from '../core/astExtractor';

export class FunctionCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
      private disposables: vscode.Disposable[] = [];

        constructor(
            private readonly extractor: TreeSitterExtractor,
                private readonly extensionUri: vscode.Uri
                  ) {
                      this.disposables.push(
                            vscode.workspace.onDidChangeConfiguration((e) => {
                                    if (e.affectsConfiguration('studentExplainer')) {
                                              this.refresh();
                                                      }
                                                            }),
                                                                  vscode.workspace.onDidChangeTextDocument((e) => {
                                                                          if (e.document === vscode.window.activeTextEditor?.document) {
                                                                                    this.refresh();
                                                                                            }
                                                                                                  })
                                                                                                      );
                                                                                                        }

                                                                                                          public refresh(): void {
                                                                                                              this._onDidChangeCodeLenses.fire();
                                                                                                                }

                                                                                                                  public async provideCodeLenses(
                                                                                                                      document: vscode.TextDocument,
                                                                                                                          token: vscode.CancellationToken
                                                                                                                            ): Promise<vscode.CodeLens[]> {
                                                                                                                                const enabled = vscode.workspace
                                                                                                                                      .getConfiguration('studentExplainer')
                                                                                                                                            .get<boolean>('enableCodeLens', true);

                                                                                                                                                if (!enabled) {
                                                                                                                                                      return [];
                                                                                                                                                          }

                                                                                                                                                              try {
                                                                                                                                                                    const initialized = await this.extractor.initParser(
                                                                                                                                                                            this.extensionUri,
                                                                                                                                                                                    document.languageId
                                                                                                                                                                                          );
                                                                                                                                                                                                if (!initialized || token.isCancellationRequested) {
                                                                                                                                                                                                        return [];
                                                                                                                                                                                                              }

                                                                                                                                                                                                                    await new Promise((resolve) => setTimeout(resolve, 0));
                                                                                                                                                                                                                          if (token.isCancellationRequested) {
                                                                                                                                                                                                                                  return [];
                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                              const locations = this.extractor.getFunctionLocations(document);

                                                                                                                                                                                                                                                    return locations.map((loc) => {
                                                                                                                                                                                                                                                            return new vscode.CodeLens(loc.range, {
                                                                                                                                                                                                                                                                      title: `$(sparkle) Explain ${loc.name}()`,
                                                                                                                                                                                                                                                                                command: 'studentExplainer.explainAtPosition',
                                                                                                                                                                                                                                                                                          arguments: [document.uri, loc.range.start]
                                                                                                                                                                                                                                                                                                  });
                                                                                                                                                                                                                                                                                                        });
                                                                                                                                                                                                                                                                                                            } catch (err) {
                                                                                                                                                                                                                                                                                                                  console.error(`[TreeSitter] Language '${document.languageId}' AST parse failed:`, err);
                                                                                                                                                                                                                                                                                                                        return [];
                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                                                                                                public dispose(): void {
                                                                                                                                                                                                                                                                                                                                    this._onDidChangeCodeLenses.dispose();
                                                                                                                                                                                                                                                                                                                                        this.disposables.forEach((d) => d.dispose());
                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                          