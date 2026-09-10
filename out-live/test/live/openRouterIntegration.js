"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const harness_1 = require("../../src/core/harness");
suite('OpenRouter live integration test suite', () => {
    test('generates a streamed explanation with a free model', async function () {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (process.env.RUN_OPENROUTER_LIVE_TESTS !== '1' || !apiKey) {
            this.skip();
        }
        const chunks = [];
        const result = await new harness_1.OpenRouterFreeHarness().generateExplanationStream(apiKey, 'Explain this JavaScript function for a student: function add(a, b) { return a + b; }', (chunk) => chunks.push(chunk));
        assert.ok(result.modelUsed, 'A model should be selected');
        assert.ok(chunks.join('').trim().length > 0, 'The response should contain streamed text');
    });
});
//# sourceMappingURL=openRouterIntegration.js.map