import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from '../config/config';
import { log } from '../observability/logger';
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
import { summarizationMiddleware } from 'langchain';
import { getLLM } from '../llm/factory';

const getCheckpointer = async (): Promise<SqliteSaver> => {
  const dbPath = config.memory.dbPath;
  await mkdir(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  log.info(`Using SQLite checkpointer at ${dbPath}`);
  return new SqliteSaver(db);
};

const getSessionHistory = (threadId: string) => {
  throw new Error('Not yet implemented...');
};

const getSummarizationMiddleware = () => {
  return summarizationMiddleware({
    model: getLLM(),
    trigger: { tokens: config.memory.summarizeAtTokens },
    keep: { messages: config.memory.keepLastMessages },
  });
};

export { getCheckpointer, getSessionHistory, getSummarizationMiddleware };
