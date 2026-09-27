import { log } from '../observability/logger';
import { loadMcpConfig } from './config';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';

// Connect to all configured MCP servers.
const getMcpClient = async () => {
  const config = await loadMcpConfig();
  log.info(`Connecting to MCP servers: ${Object.keys(config).length}`);
  const client = new MultiServerMCPClient(config);
  return client;
};

// return tools of all configured MCP servers.
const getMcpTools = async (client: MultiServerMCPClient) => {
  const tools = await client.getTools();
  log.info(`Loaded ${tools.length} tools from MCP servers`);
  return tools;
};

export { getMcpClient, getMcpTools };
