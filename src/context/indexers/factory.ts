import { indexCodebase } from './semanticQdrant';

// Return the right index_codebase function based on vector_store in config
const getIndexer = () => {
  return indexCodebase;
};

export { getIndexer };
