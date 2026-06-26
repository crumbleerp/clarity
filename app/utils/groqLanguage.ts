import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language'
import { simpleMode } from '@codemirror/legacy-modes/mode/simple-mode'
import { tags } from '@lezer/highlight'

const groqMode = simpleMode({
  start: [
    { regex: /\/\/.* /, token: 'comment' },
    { regex: /\/\*/, token: 'comment', next: 'comment' },
    { regex: /"(?:[^\\]|\\.)*?"/, token: 'string' },
    { regex: /'(?:[^\\]|\\.)*?'/, token: 'string' },
    { regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i, token: 'number' },
    { regex: /(?:select|order|asc|desc|in|match|defined|length|count|coalesce|references|sanity|versionOf|score|boost|upper|lower|round|path)\b/i, token: 'keyword' },
    { regex: /(?:true|false|null)\b/, token: 'atom' },
    { regex: /\$\w+\b/, token: 'variableName' },
    { regex: /[[\]{}()]/, token: 'bracket' },
    { regex: /(?:==|!=|>=|<=|&&|\|\||=>|->|~>|[+\-*/%<>!])/, token: 'operator' },
    { regex: /\.{3}|\.|\^|@/, token: 'operator' },
    { regex: /[a-zA-Z_]\w*/, token: 'propertyName' }
  ],
  comment: [
    { regex: /.*?\*\//, token: 'comment', next: 'start' },
    { regex: /.*/, token: 'comment' }
  ],
  languageData: {
    name: 'groq',
    closeBrackets: { brackets: ['(', '[', '{', '\'', '"'] },
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } }
  }
})

const groqHighlight = HighlightStyle.define([
  { tag: tags.comment, color: '#6a9955' },
  { tag: tags.string, color: '#ce9178' },
  { tag: tags.number, color: '#b5cea8' },
  { tag: tags.keyword, color: '#569cd6', fontWeight: 'bold' },
  { tag: tags.atom, color: '#569cd6' },
  { tag: tags.variableName, color: '#9cdcfe' },
  { tag: tags.propertyName, color: '#dcdcaa' },
  { tag: tags.operator, color: '#d4d4d4' },
  { tag: tags.bracket, color: '#ffd700' }
])

export const groqLanguage = StreamLanguage.define(groqMode)

export function groq() {
  return [groqLanguage, syntaxHighlighting(groqHighlight)]
}
