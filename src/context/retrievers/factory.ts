import { retrieve } from './semanticQdrant';

// Return the right index_codebase function based on vector_store in config
const getRetriever = () => {
  return retrieve;
};

export { getRetriever };
