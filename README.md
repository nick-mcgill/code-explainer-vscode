# Student Code Explainer

A production-ready VS Code extension designed to help computer science students understand complex code by delivering context-aware, AI-powered explanations directly inside the editor.

Built with performance, security, and reliability in mind, it parses Abstract Syntax Trees (ASTs) locally and streams structured responses from OpenRouter using an resilient multi-model failover strategy.

---

## Features

- **Inline CodeLens Integration**: Automatically displays clickable `$(sparkle) Explain` action triggers above functions, methods, and key structures using AST parsing.
- **Code Extraction**: Uses local syntax-aware boundary detection to ensure complete function blocks are passed as LLM context.
- **Resilient AI Harness**: Connects to OpenRouter's free-tier APIs with built-in retry logic, exponential backoff, and dynamic failover across models (`Llama 3.3`, `Qwen 2.5 Coder`, and `DeepSeek R1`).
- **Encrypted Secret Storage**: Native key management using `vscode.SecretStorage` to keep user API tokens secure on disk.
- **Side Panel Webview**: Real-time response streaming in an isolated webview panel protected by strict Content Security Policies (CSP).

---

## Architecture & Tech Stack

- **Language**: TypeScript (ES2022 / Node 24 runtime target)
- **Bundler**: `esbuild` (strict <250KB bundle limit quality gate)
- **Code Parsing**: Local syntax-aware extraction
- **Security**: `vscode.SecretStorage`
- **Test Framework**: `mocha` + `@vscode/test-cli` + `sinon`
- **Coverage**: `c8`-enforced coverage for same-process unit tests; VS Code integration tests run separately

---

## Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v24.0.0 or higher
- [VS Code](https://code.visualstudio.com/) v1.85.0 or higher

### Development Setup

1. **Clone Repository & Install Dependencies**:
   ```bash
   git clone [https://github.com/local-dev/student-explainer.git](https://github.com/local-dev/student-explainer.git)
   cd student-explainer
   npm ci
   ```

2. **Build and test**:
   ```bash
   npm run compile
   npm test
   ```

   To run the coverage-enforced unit suite:
   ```bash
   npm run test:coverage
   ```

3. **Package the extension**:
   ```bash
   npm run package
   ```