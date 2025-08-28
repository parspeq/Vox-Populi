'use server';

/**
 * @fileOverview A flow to suggest related topics based on the content of the current thread.
 *
 * - suggestRelatedTopics - A function that suggests related topics based on the content of the current thread.
 * - SuggestRelatedTopicsInput - The input type for the suggestRelatedTopics function.
 * - SuggestRelatedTopicsOutput - The return type for the suggestRelatedTopics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelatedTopicsInputSchema = z.object({
  threadContent: z.string().describe('The content of the current thread.'),
});
export type SuggestRelatedTopicsInput = z.infer<typeof SuggestRelatedTopicsInputSchema>;

const SuggestRelatedTopicsOutputSchema = z.object({
  relatedTopics: z
    .array(z.string())
    .describe('A list of related topics based on the content of the thread.'),
});
export type SuggestRelatedTopicsOutput = z.infer<typeof SuggestRelatedTopicsOutputSchema>;

export async function suggestRelatedTopics(
  input: SuggestRelatedTopicsInput
): Promise<SuggestRelatedTopicsOutput> {
  return suggestRelatedTopicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRelatedTopicsPrompt',
  input: {schema: SuggestRelatedTopicsInputSchema},
  output: {schema: SuggestRelatedTopicsOutputSchema},
  prompt: `You are an AI assistant designed to suggest related topics for discussion threads.

  Given the content of the current thread, suggest a list of related topics that might be of interest to users.

  Thread Content: {{{threadContent}}}

  Suggest related topics:
  `,
});

const suggestRelatedTopicsFlow = ai.defineFlow(
  {
    name: 'suggestRelatedTopicsFlow',
    inputSchema: SuggestRelatedTopicsInputSchema,
    outputSchema: SuggestRelatedTopicsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
