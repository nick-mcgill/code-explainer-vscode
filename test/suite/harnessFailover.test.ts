import * as assert from 'assert';
import * as sinon from 'sinon';
import { Readable } from 'stream';
import { OpenRouterFreeHarness } from '../../src/core/harness';

suite('OpenRouterFreeHarness Model Failover Test Suite', () => {
    let sandbox: sinon.SinonSandbox;
    let harness: OpenRouterFreeHarness;

    const modelsResponse = () => ({
        status: 200,
        ok: true,
        json: async () => ({
            data: [
                {
                    id: 'meta-llama/llama-3.3-70b-instruct:free',
                    pricing: { prompt: '0', completion: '0' },
                    architecture: { input_modalities: ['text'], output_modalities: ['text'] }
                },
                {
                    id: 'qwen/qwen-2.5-coder-32b-instruct:free',
                    pricing: { prompt: '0', completion: '0' },
                    architecture: { input_modalities: ['text'], output_modalities: ['text'] }
                },
                {
                    id: 'image-model',
                    pricing: { prompt: '0', completion: '0' },
                    architecture: { input_modalities: ['image'], output_modalities: ['image'] }
                }
            ]
        })
    });

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('falls back to secondary model when primary model repeatedly fails', async () => {
        const stream = Readable.from([
            'data: {"choices":[{"delta":{"content":"Fallback success"}}]}\n\n',
            'data: [DONE]\n\n'
        ]);
        const fetchStub = sandbox.stub();
        harness = new OpenRouterFreeHarness(fetchStub as unknown as typeof fetch);

        fetchStub.onCall(0).resolves(modelsResponse());
        fetchStub.onCall(1).resolves({ status: 500, ok: false, text: async () => 'Server Error' } as any);
        fetchStub.onCall(2).resolves({ status: 500, ok: false, text: async () => 'Server Error' } as any);
        fetchStub.onCall(3).resolves({ status: 500, ok: false, text: async () => 'Server Error' } as any);

        fetchStub.onCall(4).resolves({ status: 200, ok: true, body: stream } as any);

        const chunks: string[] = [];
        const result = await harness.generateExplanationStream(
            'sk-test-key',
            'Prompt text',
            (chunk) => chunks.push(chunk)
        );

        assert.strictEqual(result.modelUsed, 'qwen/qwen-2.5-coder-32b-instruct:free');
        assert.deepStrictEqual(chunks, ['Fallback success']);
        assert.strictEqual(fetchStub.callCount, 5);
        assert.strictEqual(fetchStub.firstCall.args[0], 'https://openrouter.ai/api/v1/models');
    });

    test('throws error when all models and retries are exhausted', async () => {
        const fetchStub = sandbox.stub();
        harness = new OpenRouterFreeHarness(fetchStub as unknown as typeof fetch);
        fetchStub.onCall(0).resolves(modelsResponse());
        fetchStub.callsFake(() => Promise.resolve({
            status: 500,
            ok: false,
            text: async () => 'Internal Error'
        } as any));

        await assert.rejects(
            async () => {
                await harness.generateExplanationStream('sk-test-key', 'Prompt text', () => { });
            },
            (err: Error) => {
                return err.message.includes('exhausted') || err.message.includes('500');
            }
        );
    });

    test('preserves SSE records split across network chunks', async () => {
        const stream = Readable.from([
            'data: {"choices":[{"delta":{"con',
            'tent":"Split success"}}]}\n\n',
            'data: [DONE]\n\n'
        ]);
        const fetchStub = sandbox.stub();
        fetchStub.onCall(0).resolves(modelsResponse());
        fetchStub.onCall(1).resolves({ status: 200, ok: true, body: stream } as any);
        harness = new OpenRouterFreeHarness(fetchStub as unknown as typeof fetch);

        const chunks: string[] = [];
        await harness.generateExplanationStream('sk-test-key', 'Prompt text', (chunk) => chunks.push(chunk));

        assert.deepStrictEqual(chunks, ['Split success']);
    });

    test('retries rate-limited responses and parses a final unterminated SSE record', async () => {
        const stream = Readable.from([
            'data: {"choices":[{"delta":{"content":"Rate limit recovered"}}]}'
        ]);
        const fetchStub = sandbox.stub();
        fetchStub.onCall(0).resolves(modelsResponse());
        fetchStub.onCall(1).resolves({ status: 429, ok: false, text: async () => 'Rate limited' } as any);
        fetchStub.onCall(2).resolves({ status: 200, ok: true, body: stream } as any);
        harness = new OpenRouterFreeHarness(fetchStub as unknown as typeof fetch);

        const chunks: string[] = [];
        await harness.generateExplanationStream('sk-test-key', 'Prompt text', (chunk) => chunks.push(chunk));

        assert.deepStrictEqual(chunks, ['Rate limit recovered']);
        assert.strictEqual(fetchStub.callCount, 3);
    });
});
