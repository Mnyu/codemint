import { HumanMessage } from 'langchain';
import { log } from '../observability/logger';
import { buildAgent } from './factory';

//Entry point for all user queries - builds the agent and runs it.
const handleQuery = async (query: string) => {
  log.info(`Handling query: ${query}`);
  const agent = buildAgent();
  const response = await agent.invoke({ messages: new HumanMessage(query) });
  const reply = response.messages[response.messages.length - 1]?.content;
  return reply;
};

export { handleQuery };
