#!/usr/bin/env bun

import { handleQuery } from './src/agent/orchestrator';
import { config } from './src/config/config';
import { getIndexer } from './src/context/indexers/factory';
import { getEmbedder, getLLM } from './src/llm/factory';
import { createNewSession, getCurrentSession, switchSession } from './src/memory/session';
import { log } from './src/observability/logger';

const EXIT = '/exit';
const QUIT = '/quit';
const ASK = '/ask ';
const NEW_SESSION = '/new_session';
const SWITCH = '/switch ';
const SESSION = '/session';

const getOrCreateIndex = async () => {
  const repoPath = process.cwd();
  log.info(`Checking index for: ${repoPath}`);
  console.log(`Checking index for: ${repoPath}...`);
  return await getIndexer()(repoPath);
};

const initialize = async () => {
  const llm = getLLM();
  const embedder = getEmbedder();
  console.log(`LLM : ${config.llm.provider}-${config.llm.model}`);
  console.log(`Embedder : ${config.embeddings.provider}-${config.embeddings.model}`);

  const index = await getOrCreateIndex();
  const sessionId = await getCurrentSession();
  console.log(`Session: ${sessionId}`);
  console.log(`✓ Ready`);
  return { llm, embedder, index, sessionId };
};

const run = async () => {
  log.info('Starting CodeMint...');
  console.log(`Code Mint - RAG powered code assistant`);

  let { llm, embedder, index, sessionId } = await initialize();
  console.log(`Type /exit to quit \n`);

  while (true) {
    const userInput = prompt('>')?.trim();
    if (!userInput) {
      continue;
    }
    if (userInput.toLowerCase() === EXIT || userInput.toLowerCase() === QUIT) {
      log.info('Shutting down...');
      console.log(`Goodbye!`);
      break;
    } else if (userInput.toLowerCase().startsWith(ASK)) {
      const question = userInput.slice(ASK.length).trim();
      log.info('Ask command received:', question);
      console.log(`Searching for: ${question}...`);
      const reply = await handleQuery(question, sessionId);
      console.log(reply);
    } else if (userInput.toLowerCase() === NEW_SESSION) {
      sessionId = await createNewSession();
      console.log(`New session started: ${sessionId}`);
    } else if (userInput.toLowerCase().startsWith(SWITCH)) {
      const targetSessionId = userInput.slice(SWITCH.length).trim();
      sessionId = await switchSession(targetSessionId);
      console.log(`Switched to session: ${sessionId}`);
    } else if (userInput.toLowerCase() === SESSION) {
      console.log(`Current session: ${sessionId}`);
    } else {
      log.warn('Unknown command received:', userInput);
      console.log(`Unknown command. Try:`);
      console.log(`\t/ask <question> - ask a question`);
      console.log(`\t/new_session - start a fresh conversation`);
      console.log(`\t/switch <session_id> - resume a past session`);
      console.log(`\t/session - show current session id`);
      console.log(`\t/exit - exit codemint`);
    }
  }
};

await run();
