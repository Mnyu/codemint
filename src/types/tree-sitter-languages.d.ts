declare module 'tree-sitter-languages' {
  import Parser from 'tree-sitter';

  export function getParser(language: string): Parser;
  export function getLanguage(language: string): unknown;
}
