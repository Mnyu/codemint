import { readFile } from 'node:fs/promises';
import YAML from 'yaml';
import { z } from 'zod';

const ConfigSchema = z.object({
  llm: z.object({
    baseurl: z.string().optional(),
    provider: z.string(),
    model: z.string(),
  }),
  embeddings: z.object({
    provider: z.string(),
    model: z.string(),
  }),
});

type Config = z.infer<typeof ConfigSchema>;

const loadConfig = async (path: string): Promise<Config> => {
  const content = await readFile(path, 'utf-8');
  const raw = YAML.parse(content);
  return ConfigSchema.parse(raw);
};

export const config = await loadConfig('./config.yaml');
