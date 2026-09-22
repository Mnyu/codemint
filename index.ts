#!/usr/bin/env bun

import { log } from './src/observability/logger';

const EXIT = '/exit';
const QUIT = '/quit';
const ASK = '/ask ';

const run = async () => {
  log.info('Starting CodeMint...');
  console.log(`Code Mint - RAG powered code assistant`);
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
      // TODO : Call retriever + LLM
    } else {
      log.warn('Unknown command received:', userInput);
      console.log(`Unknown command. Try:`);
      console.log(`\task <question> - ask a question`);
      console.log(`\task <question> - ask a question`);
    }
  }
};

await run();
