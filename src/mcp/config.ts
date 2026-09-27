import { join } from 'node:path';

const CONFIG_PATH = join(import.meta.dir, '..', 'mcpServers.json');

const loadMcpConfig = async () => {
  let configString = JSON.stringify(await Bun.file(CONFIG_PATH).json());
  if (process.env.CWD === undefined) {
    process.env.CWD = process.cwd();
  }
  configString = configString.replace(/\$\{(\w+)\}/g, (_, name: string) => process.env[name] ?? '');
  const config = JSON.parse(configString);
  return config[`mcp_servers`];
};

export { loadMcpConfig };
