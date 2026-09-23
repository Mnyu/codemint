import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { z } from 'zod';
import { log } from '../../observability/logger';
import type Parser from 'tree-sitter';
import { getParser } from '../../lib/parser';

// Maps file extension → tree-sitter language name
// tree-sitter-languages bundles all these grammars, no extra installs needed.
const EXTENSION_TO_LANGUAGE = new Map<string, string>([
  ['.py', 'python'],
  ['.js', 'javascript'],
  ['.jsx', 'javascript'],
  ['.ts', 'typescript'],
  ['.tsx', 'tsx'],
  ['.java', 'java'],
  ['.go', 'go'],
  ['.rs', 'rust'],
  ['.cpp', 'cpp'],
  ['.c', 'c'],
  ['.cs', 'c_sharp'],
  ['.rb', 'ruby'],
  ['.php', 'php'],
  ['.swift', 'swift'],
  ['.kt', 'kotlin'],
  ['.sh', 'bash'],
]);

// Text/config files have no meaningful AST — we chunk them by line count instead.
const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.yaml', '.yml', '.json', '.toml']);
const ALL_EXTENSIONS = new Set([...EXTENSION_TO_LANGUAGE.keys(), ...TEXT_EXTENSIONS]);

// Tree-sitter node type names that correspond to a named, indexable block.
// These are consistent across languages — tree-sitter uses the same names where possible.
const BLOCK_NODE_TYPES = [
  'function_definition',
  'function_declaration',
  'method_definition',
  'arrow_function',
  'class_definition',
  'class_declaration',
  'method_declaration',
  'constructor_declaration',
  'interface_declaration',
  'function_item', // Rust uses this instead of function_definition
  'func_declaration', // Go
];

const ParsedChunkSchema = z.object({
  name: z.string(),
  type: z.string(),
  content: z.string(),
  source: z.string(),
  startLine: z.number(),
  endLine: z.number(),
});
type ParsedChunk = z.infer<typeof ParsedChunkSchema>;

// Entry point — routes to AST parsing or sliding window based on file type.
const parseFile = async (filepath: string): Promise<ParsedChunk[]> => {
  const ext = path.extname(filepath).toLowerCase();

  if (TEXT_EXTENSIONS.has(ext)) {
    const content = await Bun.file(filepath).text();
    const lines = content.split(/\r?\n/);

    return slidingWindow(filepath, lines);
  }
  const languageName = EXTENSION_TO_LANGUAGE.get(ext);
  if (!languageName) {
    throw new Error(`Unsupported file type: ${ext}`);
  }
  const fileContent = await Bun.file(filepath).text();
  return parseWithTreeSitter(filepath, fileContent, languageName);
};

const parseWithTreeSitter = (filepath: string, fileContent: string, languageName: string): ParsedChunk[] => {
  log.info(`Parsing ${languageName} file: ${filepath}`);
  const parser = getParser(languageName);
  const tree = parser.parse(fileContent);
  const lines = fileContent.split(/\r?\n/);

  const chunks: ParsedChunk[] = [];

  const root = tree.rootNode;
  // Walk all nodes
  for (const node of walkTree(root)) {
    const parent = node.parent;
    if (!parent) {
      continue;
    }
    if (BLOCK_NODE_TYPES.includes(node.type)) {
      const name = extractName(node, fileContent);
      const content = fileContent.substring(node.startIndex, node.endIndex);
      const chunkType = node.type.includes('class') ? 'class' : 'function';
      chunks.push({
        name: name,
        type: chunkType,
        content: content,
        source: filepath,
        startLine: node.startIndex + 1,
        endLine: node.endIndex + 1,
      });
      log.debug(`Found ${chunkType} ${name} (lines ${node.startIndex + 1}-${node.endIndex + 1})`);
    }
  }

  return chunks;
};

const walkTree = function* (node: Parser.SyntaxNode): Generator<Parser.SyntaxNode> {
  yield node;
  for (const child of node.namedChildren) {
    yield* walkTree(child);
  }
};

// Find the identifier child of a block node and return its text as the chunk name.
const extractName = (node: Parser.SyntaxNode, fileContent: string) => {
  for (const child of node.children) {
    if (['identifier', 'name', 'property_identifier'].includes(child.type)) {
      return fileContent.substring(child.startIndex, child.endIndex);
    }
  }
  return node.type;
};

//Split lines into overlapping fixed-size chunks.
// Used for text files and as a fallback when AST parsing finds nothing.
const CHUNK_SIZE = 50;
const CHUNK_OVERLAP = 10;
const slidingWindow = (filepath: string, lines: string[]): ParsedChunk[] => {
  if (!lines) {
    throw new Error(`Empty file: ${filepath}`);
  }
  const chunks = [];
  const step = CHUNK_SIZE - CHUNK_OVERLAP;
  let i = 0;
  for (let start = 0; start < lines.length; start += step, i++) {
    const end = Math.min(start + CHUNK_SIZE, lines.length);
    const text = lines.slice(start, end).join('\n').trim();
    if (text) {
      chunks.push({
        name: `chunk_${i}`,
        type: 'block',
        content: text,
        source: filepath,
        startLine: start + 1,
        endLine: end,
      });
    }
    if (end === lines.length) {
      break;
    }
  }
  log.info(`Parsed ${chunks.length} chunks from ${filepath}`);
  return chunks;
};

const getSourceFiles = async (repoPath: string, skipDirs: string[] = []): Promise<string[]> => {
  const skip = new Set(skipDirs);
  const files: string[] = [];
  await walk(repoPath, skip, files);
  log.info(`Found ${files.length} source files in ${repoPath}`);
  return files;
};

const walk = async (directory: string, skip: Set<string>, files: string[]) => {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (skip.has(entry.name)) {
        continue;
      }
      await walk(fullPath, skip, files);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (ALL_EXTENSIONS.has(ext)) {
      files.push(path.join(directory, entry.name));
    }
  }
};

export { getSourceFiles, parseFile, type ParsedChunk };
