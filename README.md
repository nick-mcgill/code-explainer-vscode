# Student Code Explainer

A VS Code extension designed to help computer science students understand code by generating AI-powered explanations directly inside the editor.

## Features

- **Inline CodeLens Integration**: Displays clickable `$(sparkle) Explain` CodeLenses directly above function declarations.
- **AST Parsing**: Uses `web-tree-sitter` to accurately locate and frame function blocks for evaluation.
- **Resilient AI Harness**: Connects to OpenRouter's free API tier with built-in retry logic, exponential backoff, and automatic failover across multiple models (Llama 3.3, Qwen 2.5 Coder, DeepSeek R1).
- **Secure Key Storage**: Encrypts and retrieves your OpenRouter API key natively using `vscode.SecretStorage`.
- **Side Panel Webview**: Streams explanations in real time within a dedicated webview panel protected by a strict Content Security Policy (CSP).

## Setup & Local Development

1. **Install Dependencies**:
   ```bash
      npm install
      