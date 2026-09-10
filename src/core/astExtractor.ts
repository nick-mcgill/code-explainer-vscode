import * as vscode from 'vscode';

export interface FunctionLocation {
  name: string;
    range: vscode.Range;
    }

    export class TreeSitterExtractor {
      private isInitialized = false;

        public async initParser(extensionUri: vscode.Uri, languageId: string): Promise<boolean> {
            const supportedLanguages = ['typescript', 'javascript', 'java', 'cpp'];
                if (!supportedLanguages.includes(languageId)) {
                      return false;
                          }
                              this.isInitialized = true;
                                  return true;
                                    }

                                      public getFunctionLocations(document: vscode.TextDocument): FunctionLocation[] {
                                          if (!this.isInitialized) {
                                                return [];
                                                    }

                                                        const locations: FunctionLocation[] = [];
                                                            const text = document.getText();
                                                                const regex = /(?:function\s+([a-zA-Z0-9_]+)|([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{)/g;
                                                                    let match: RegExpExecArray | null;

                                                                        while ((match = regex.exec(text)) !== null) {
                                                                              const name = match[1] || match[2];
                                                                                    if (name) {
                                                                                            const pos = document.positionAt(match.index);
                                                                                                    const range = new vscode.Range(pos, pos.translate(0, name.length));
                                                                                                            locations.push({ name, range });
                                                                                                                  }
                                                                                                                      }

                                                                                                                          return locations;
                                                                                                                            }
                                                                                                                            }
                                                                                                                            