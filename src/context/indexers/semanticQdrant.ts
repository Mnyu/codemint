import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../../config/config';
import { getEmbedder } from '../../llm/factory';
import { log } from '../../observability/logger';
import { QdrantVectorStore } from '@langchain/qdrant';
import { getSourceFiles, parseFile, type ParsedChunk } from './codeParser';
import { Document } from 'langchain';

// Parse all source files in repo_path, embed each chunk and store in Qdrant.
//  Returns the QdrantVectorStore. Skips indexing if collection already has data.
const indexCodebase = async (repoPath: string) => {
  const embedder = getEmbedder();
  const url = config.qdrant.url;
  const collectionName = config.qdrant.collection;
  const client = new QdrantClient({ url });
  const collections = await client.getCollections();
  const existingCollectionNames = new Set(collections.collections.map((c) => c.name));
  if (existingCollectionNames.has(collectionName)) {
    const info = await client.getCollection(collectionName);
    if (info.points_count && info.points_count > 0) {
      log.info(`Loaded existing index with ${info.points_count} chunks`);
      return await QdrantVectorStore.fromExistingCollection(embedder, { url, collectionName });
    }
  }
  log.info(`Starting semantic indexing of ${repoPath}`);
  const filepaths = await getSourceFiles(repoPath);
  const docs: Document[] = [];

  for (const filepath of filepaths) {
    let parsedChunks: ParsedChunk[] = [];
    try {
      parsedChunks = await parseFile(filepath);
    } catch (error) {
      log.error(`Skipping ${filepath}`, error);
      continue;
    }
    for (const chunk of parsedChunks) {
      docs.push(
        new Document({
          pageContent: chunk.content,
          metadata: {
            source: chunk.source,
            name: chunk.name,
            type: chunk.type,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
          },
        }),
      );
      log.debug(`Indexed ${chunk.type} ${chunk.name} from ${filepath}`);
    }
  }
  const vectorStore = await QdrantVectorStore.fromDocuments(docs, embedder, { url, collectionName });
  log.info(`Semantic indexing complete. Total chunks: ${docs.length}`);
  return vectorStore;
};

const showIndex = (vectorStore: QdrantVectorStore) => {
  throw new Error(`Not yet implemented`);
};

export { indexCodebase, showIndex };
