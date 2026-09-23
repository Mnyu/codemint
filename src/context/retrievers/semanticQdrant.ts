import { QdrantVectorStore } from '@langchain/qdrant';
import { config } from '../../config/config';
import { getEmbedder } from '../../llm/factory';
import { log } from '../../observability/logger';
import type { ParsedChunk } from '../indexers/codeParser';

// Embed the query and find the k most similar chunks in Qdrant.
// Returns a list of results with content and metadata.
const retrieve = async (query: string, k: number = 5) => {
  const embedder = getEmbedder();
  const url = config.qdrant.url;
  const collectionName = config.qdrant.collection;
  const vectorStore = await QdrantVectorStore.fromExistingCollection(embedder, { url, collectionName });
  log.info(`Retrieving top ${k} chunks for query: ${query}`);
  const results = await vectorStore.similaritySearchWithScore(query, k);
  const chunks = results.map(([doc, score]) => {
    const meta = doc.metadata;
    const chunk = {
      content: doc.pageContent,
      source: meta['source'],
      name: meta['name'],
      type: meta['type'],
      startLine: meta['start_line'],
      endLine: meta['end_line'],
      distance: score,
    };
    log.debug(`Retrieved ${meta['type']} '${meta['name']}' from ${meta['source']} (score: ${score.toFixed(4)})`);

    return chunk;
  });
  log.info(`Retrieved ${chunks.length} chunks`);
  return chunks;
};

export { retrieve };
