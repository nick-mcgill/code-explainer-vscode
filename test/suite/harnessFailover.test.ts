import * as assert from 'assert';
import * as sinon from 'sinon';
import { Readable } from 'stream';
import * as fetchModule from 'node-fetch';
import { OpenRouterFreeHarness } from '../../src/core/harness';

suite('OpenRouterFreeHarness Model Failover Test Suite', () => {
    let sandbox: sinon.SinonSandbox;
    let harness: OpenRouterFreeHarness;

    setup(() => {
        sandbox = sinon.createSandbox();
        harness = new OpenRouterFreeHarness();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('falls back to secondary model when primary model repeatedly fails', async () => {
        const stream = Readable.from([
            'data: {"choices":[{"delta":{"content":"Fallback success"}}]}\n\n',
            'data: [DONE]\n\n'
        ]);
        const fetchStub = sandbox.stub(fetchModule, 'default' as any);

        fetchStub.onCall(0).resolves({ status: 500, ok: false, text: async () => 'Server Error' } as any);
        fetchStub.onCall(1).resolves({ status: 500, ok: false, text: async () => 'Server Error' } as any);
        fetchStub.onCall(2).resolves({ status: 500, ok: false, text: async () => 'Server Error' } as any);

        fetchStub.onCall(3).resolves({ status: 200, ok: true, body: stream } as any);

        const chunks: string[] = [];
        const result = await harness.generateExplanationStream(
            'sk-test-key',
            'Prompt text',
            (chunk) => chunks.push(chunk)
        );

        assert.strictEqual(result.modelUsed, 'qwen/qwen-2.5-coder-32b-instruct:free');
        assert.deepStrictEqual(chunks, ['Fallback success']);
        assert.strictEqual(fetchStub.callCount, 4);
    });

    test('throws error when all models and retries are exhausted', async () => {
        const fetchStub = sandbox.stub(fetchModule, 'default' as any);
        fetchStub.resolves({
            status: 500,
            ok: false,
            text: async () => 'Internal Error'
        } as any);

        await assert.rejects(
            async () => {
                await harness.generateExplanationStream('sk-test-key', 'Prompt text', () => { });
            },
            (err: Error) => {
                return err.message.includes('exhausted') || err.message.includes('500');
            }
        );
    });
});
