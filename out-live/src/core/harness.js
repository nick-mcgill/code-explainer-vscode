"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenRouterFreeHarness = void 0;
const PREFERRED_MODELS = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen-2.5-coder-32b-instruct:free'
];
class OpenRouterFreeHarness {
    fetchImpl;
    constructor(fetchImpl = globalThis.fetch) {
        this.fetchImpl = fetchImpl;
    }
    async generateExplanationStream(apiKey, prompt, onChunk, signal) {
        const models = await this.getAvailableFreeModels(apiKey, signal);
        let lastError = null;
        for (const model of models) {
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    if (attempt > 0) {
                        const backoffMs = Math.pow(2, attempt) * 1000;
                        await new Promise((res) => setTimeout(res, backoffMs));
                    }
                    const response = await this.fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
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
                    if (response.status === 404) {
                        lastError = new Error(`Model '${model}' is no longer available.`);
                        break;
                    }
                    if (!response.ok || !response.body) {
                        throw new Error(`HTTP Error ${response.status}: ${await response.text()}`);
                    }
                    let buffer = '';
                    let done = false;
                    for await (const chunkBuffer of response.body) {
                        buffer += chunkBuffer.toString();
                        const lines = buffer.split(/\r?\n/);
                        buffer = lines.pop() ?? '';
                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed.startsWith('data: '))
                                continue;
                            const dataStr = trimmed.slice(6);
                            if (dataStr === '[DONE]') {
                                done = true;
                                break;
                            }
                            try {
                                const parsed = JSON.parse(dataStr);
                                const content = parsed.choices?.[0]?.delta?.content;
                                if (content) {
                                    onChunk(content);
                                }
                            }
                            catch (err) {
                                throw new Error(`Invalid streaming response: ${String(err)}`);
                            }
                        }
                        if (done)
                            break;
                    }
                    if (buffer.trim() && !done) {
                        const trimmed = buffer.trim();
                        if (trimmed.startsWith('data: ') && trimmed.slice(6) !== '[DONE]') {
                            const parsed = JSON.parse(trimmed.slice(6));
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content)
                                onChunk(content);
                        }
                    }
                    return { modelUsed: model };
                }
                catch (err) {
                    if (err.name === 'AbortError')
                        throw err;
                    lastError = err;
                }
            }
        }
        throw lastError || new Error('All model endpoints and retries exhausted.');
    }
    async getAvailableFreeModels(apiKey, signal) {
        const response = await this.fetchImpl('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://github.com/student-explainer',
                'X-Title': 'Student Explainer VSCode'
            },
            signal
        });
        if (!response.ok) {
            throw new Error(`Unable to discover OpenRouter models (HTTP ${response.status}).`);
        }
        const payload = await response.json();
        const freeTextModels = (payload.data ?? [])
            .filter((model) => model.id && model.pricing?.prompt === '0' && model.pricing?.completion === '0')
            .filter((model) => model.architecture?.input_modalities?.includes('text') &&
            model.architecture?.output_modalities?.includes('text'))
            .map((model) => model.id);
        const preferred = PREFERRED_MODELS.filter((model) => freeTextModels.includes(model));
        const remaining = freeTextModels.filter((model) => !preferred.includes(model));
        const models = [...preferred, ...remaining];
        if (models.length === 0) {
            throw new Error('OpenRouter returned no available free text-generation models.');
        }
        return models;
    }
}
exports.OpenRouterFreeHarness = OpenRouterFreeHarness;
//# sourceMappingURL=harness.js.map