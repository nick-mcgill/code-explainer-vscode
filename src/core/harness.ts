import fetch from 'node-fetch';

const FALLBACK_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen-2.5-coder-32b-instruct:free',
  'deepseek/deepseek-r1:free'
];

export class OpenRouterFreeHarness {
  public async generateExplanationStream(
    apiKey: string,
    prompt: string,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<{ modelUsed: string }> {
    let lastError: Error | null = null;

    for (const model of FALLBACK_MODELS) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (attempt > 0) {
            const backoffMs = Math.pow(2, attempt) * 1000;
            await new Promise((res) => setTimeout(res, backoffMs));
          }

          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://github.com/student-explainer',
              'X-Title': 'Student Explainer VSCode'
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: prompt }],
              stream: true
            }),
            signal
          });

          if (response.status === 429) {
            continue;
          }

          if (!response.ok || !response.body) {
            throw new Error(`HTTP Error ${response.status}: ${await response.text()}`);
          }

          for await (const chunkBuffer of response.body) {
            const lines = chunkBuffer.toString().split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data: ')) continue;
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') break;

              try {
                const parsed = JSON.parse(dataStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  onChunk(content);
                }
              } catch {
                // Ignore chunk parse errors
              }
            }
          }

          return { modelUsed: model };
        } catch (err: any) {
          if (err.name === 'AbortError') throw err;
          lastError = err;
        }
      }
    }

    throw lastError || new Error('All model endpoints and retries exhausted.');
  }
}
