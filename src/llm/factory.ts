import { ChatOpenAI } from '@langchain/openai';
import { config } from '../config/config';
import { HUGGING_FACE, LM_STUDIO } from '../constants';
import { log } from '../observability/logger';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';

export const getLLM = () => {
  const provider = config.llm.provider;
  const model = config.llm.model;
  log.info(`Using LLM provider: ${provider}, model : ${model}`);

  if (provider === LM_STUDIO) {
    return new ChatOpenAI({
      model: model,
      temperature: 0,
      configuration: {
        baseURL: config.llm.baseurl,
        apiKey: 'not-required-for-lm-studio',
      },
    });
  }
  throw new Error(`No LLM providers other than ${LM_STUDIO} currently supported`);
};

export const getEmbedder = () => {
  const provider = config.embeddings.provider;
  const model = config.embeddings.model;
  log.info(`Using embeddings provider: ${provider}, model : ${model}`);

  if (provider === HUGGING_FACE) {
    return new HuggingFaceTransformersEmbeddings({ model: model });
  }

  throw new Error(`No embeddings providers other than ${HUGGING_FACE} currently supported`);
};
