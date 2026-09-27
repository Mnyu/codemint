import { randomUUID } from 'node:crypto';
import path, { dirname } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { config } from '../config/config';
import { log } from '../observability/logger';

const getCurrentSessionFilePath = () => {
  return path.join(path.dirname(config.memory.dbPath), 'currentSession');
};

const createNewSession = async () => {
  const sessionId = randomUUID();
  const currentSessionFilePath = getCurrentSessionFilePath();
  await mkdir(dirname(currentSessionFilePath), { recursive: true });
  await Bun.write(currentSessionFilePath, sessionId);
  log.info(`Started new session: ${sessionId}`);
  return sessionId;
};

const getCurrentSession = async () => {
  const currentSessionFilePath = getCurrentSessionFilePath();
  const file = Bun.file(currentSessionFilePath);
  if (await file.exists()) {
    const sessionId = (await file.text()).trim();
    log.info(`Resuming session: ${sessionId}`);
    return sessionId;
  }
  return createNewSession();
};

const switchSession = async (sessionId: string) => {
  const currentSessionFilePath = getCurrentSessionFilePath();
  await Bun.write(currentSessionFilePath, sessionId);
  log.info(`Switched to session: ${sessionId}`);
  return sessionId;
};

export { getCurrentSession, switchSession, createNewSession };
