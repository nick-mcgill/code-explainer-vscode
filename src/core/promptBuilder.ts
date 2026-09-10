import * as vscode from 'vscode';

export interface CodeExplanationContext {
    codeSnippet: string;
    languageId: string;
    functionName?: string;
    fileUri?: vscode.Uri;
    surroundingContext?: string;
}

export class PromptBuilder {
    /**
     * System prompt tailored for student-facing, pedagogically sound code explanations.
     */
    private static readonly SYSTEM_PROMPT = `You are a supportive, highly knowledgeable Computer Science tutor assisting a student.
Your goal is to explain the provided code clearly, concisely, and accurately.

Follow these strict output guidelines:
1. High-Level Summary: Explain what the code does in 1-2 simple sentences. Avoid unnecessary jargon upfront.
2. Step-by-Step Breakdown: Walk through key control flows, operations, and variables sequentially.
3. Edge Cases & Potential Bugs: Highlight potential runtime traps (e.g., null pointers, off-by-one errors, infinite loops) or key performance considerations (Big-O notation if relevant).
4. Formatting: Output clean, well-structured Markdown. Use inline code backticks for variable names and functions. Do NOT output wrapping markdown code blocks around your response.`;

    /**
     * Constructs the full prompt payload for OpenRouter.
     *
     * @param context Snippet metadata and AST context extracted from the editor.
     * @returns Formatted prompt string ready for LLM consumption.
     */
    public buildPrompt(context: CodeExplanationContext): string {
        const language = context.languageId.toLowerCase();
        const targetName = context.functionName ? `function/method '${context.functionName}'` : 'selected code snippet';

        let prompt = `${PromptBuilder.SYSTEM_PROMPT}\n\n`;
        prompt += `--- CONTEXT ---\n`;
        prompt += `Target: ${targetName}\n`;
        prompt += `Language: ${language}\n`;

        if (context.surroundingContext && context.surroundingContext.trim().length > 0) {
            prompt += `\nSurrounding File Context:\n\`\`\`${language}\n${context.surroundingContext}\n\`\`\`\n`;
        }

        prompt += `\nTarget Code to Explain:\n\`\`\`${language}\n${context.codeSnippet}\n\`\`\`\n`;
        prompt += `\nPlease provide a student-friendly explanation following the guidelines above.`;

        return prompt;
    }
}