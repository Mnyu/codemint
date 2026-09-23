#!/usr/bin/env bun

import { handleQuery } from './src/agent/orchestrator';
import { config } from './src/config/config';
import { getIndexer } from './src/context/indexers/factory';
import { getEmbedder, getLLM } from './src/llm/factory';
import { log } from './src/observability/logger';

const EXIT = '/exit';
const QUIT = '/quit';
const ASK = '/ask ';

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
  console.log(`✓ Ready`);
  return { llm, embedder, index };
};

const run = async () => {
  log.info('Starting CodeMint...');
  console.log(`Code Mint - RAG powered code assistant`);

  const { llm, embedder, index } = await initialize();
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
      const reply = await handleQuery(question);
      console.log(reply);
    } else {
      log.warn('Unknown command received:', userInput);
      console.log(`Unknown command. Try:`);
      console.log(`\task <question> - ask a question`);
      console.log(`\task <question> - ask a question`);
    }
  }
};

await run();
