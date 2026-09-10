import * as assert from 'assert';
import type { Context } from 'mocha';
import { OpenRouterFreeHarness } from '../../src/core/harness';

suite('OpenRouter live integration test suite', () => {
    test('generates a streamed explanation with a free model', async function (this: Context) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (process.env.RUN_OPENROUTER_LIVE_TESTS !== '1' || !apiKey) {
            this.skip();
        }

        const chunks: string[] = [];
        const result = await new OpenRouterFreeHarness().generateExplanationStream(
            apiKey,
            'Explain this JavaScript function for a student: function add(a, b) { return a + b; }',
            (chunk) => chunks.push(chunk)
        );

        assert.ok(result.modelUsed, 'A model should be selected');
        assert.ok(chunks.join('').trim().length > 0, 'The response should contain streamed text');
    });
});