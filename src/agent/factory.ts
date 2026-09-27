import { createAgent, DynamicStructuredTool } from 'langchain';
import { getLLM } from '../llm/factory';
import { log } from '../observability/logger';
import { searchCodebase } from './tools';
import { getCheckpointer, getSummarizationMiddleware } from '../memory/stm';

const SYSTEM_PROMPT = `You are a senior software engineer with deep knowledge of the codebase.
  Always use the search_codebase tool before answering any question.
  Reference specific file names, function names and line numbers in your answers.
  If you cannot find the answer in the codebase, say so explicitly.`;

const buildAgent = async (mcpTools: DynamicStructuredTool[]) => {
  const llm = getLLM();
  const tools = [searchCodebase, ...mcpTools];
  const checkpointer = await getCheckpointer();
  log.info('Creating agent');
  return createAgent({
    model: llm,
    tools: tools,
    checkpointer: checkpointer,
    middleware: [getSummarizationMiddleware()],
    systemPrompt: SYSTEM_PROMPT,
  });
};

export { buildAgent };
