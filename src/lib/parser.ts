import Parser from 'tree-sitter';

import Python from 'tree-sitter-python';
import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript';
import Java from 'tree-sitter-java';
import Go from 'tree-sitter-go';
import Rust from 'tree-sitter-rust';
import Cpp from 'tree-sitter-cpp';
import C from 'tree-sitter-c';
// import CSharp from 'tree-sitter-c-sharp';
import Ruby from 'tree-sitter-ruby';
import PHP from 'tree-sitter-php';
import Swift from 'tree-sitter-swift';
import Kotlin from 'tree-sitter-kotlin';
import Bash from 'tree-sitter-bash';

type LanguageParser = Parameters<Parser['setLanguage']>[0];

const LANGUAGE_PARSERS: Record<string, LanguageParser> = {
  python: Python,
  javascript: JavaScript,
  typescript: TypeScript.typescript,
  tsx: TypeScript.tsx,
  java: Java,
  go: Go,
  rust: Rust,
  cpp: Cpp,
  c: C,
  // c_sharp: CSharp,
  ruby: Ruby,
  php: PHP.php,
  swift: Swift,
  kotlin: Kotlin,
  bash: Bash,
};

const getParser = (languageName: string): Parser => {
  const language = LANGUAGE_PARSERS[languageName];
  if (!language) {
    throw new Error(`Unsupported language: ${languageName}`);
  }
  const parser = new Parser();
  parser.setLanguage(language);
  return parser;
};

export { getParser };
