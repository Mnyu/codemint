import { DynamicStructuredTool, HumanMessage } from 'langchain';
import { log } from '../observability/logger';
import { buildAgent } from './factory';

//Entry point for all user queries - builds the agent and runs it.
const handleQuery = async (query: string, threadId: string, mcpTools: DynamicStructuredTool[]) => {
  log.info(`Handling query: ${query}`);
  const agent = await buildAgent(mcpTools);
  const config = { configurable: { thread_id: threadId } };
  const response = await agent.invoke({ messages: new HumanMessage(query) }, config);
  const reply = response.messages[response.messages.length - 1]?.content;
  return reply;
};

export { handleQuery };
