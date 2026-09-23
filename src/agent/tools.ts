import { tool } from '@langchain/core/tools';
import { log } from '../observability/logger';
import { retrieve } from '../context/retrievers/semanticQdrant';
import { z } from 'zod';

const searchCodebase = tool(
  async (query: string) => {
    log.info(`Tool called: search_codebase with query: ${query}`);
    const chunks = await retrieve(query, 5);

    if (!chunks || chunks.length == 0) {
      return `No relevant code found.`;
    }
    const results = [];
    for (const chunk of chunks) {
      results.push(`File : ${chunk.source} (lines ${chunk.startLine}-${chunk.endLine})\n
        Type: ${chunk.type} — ${chunk.name}\n
        Code: \n${chunk.content}\n`);
    }
    return results.join('\n---\n');
  },
  {
    name: 'searchCodebase',
    description:
      'Search the codebase for relevant classes, functions or logic.Use this tool whenever you need to find code related to a question',
    schema: z.string().describe('query'),
  },
);

export { searchCodebase };
