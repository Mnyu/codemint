import { createAgent } from 'langchain';
import { getLLM } from '../llm/factory';
import { log } from '../observability/logger';
import { searchCodebase } from './tools';

const SYSTEM_PROMPT = `You are a senior software engineer with deep knowledge of the codebase.
  Always use the search_codebase tool before answering any question.
  Reference specific file names, function names and line numbers in your answers.
  If you cannot find the answer in the codebase, say so explicitly.`;

const buildAgent = () => {
  const llm = getLLM();
  const tools = [searchCodebase];
  log.info('Creating agent');
  return createAgent({
    model: llm,
    tools: tools,
    systemPrompt: SYSTEM_PROMPT,
  });
};

export { buildAgent };
