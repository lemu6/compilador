// scanner.js - Analisador léxico
// Ordem dos padrões importa: mais específicos primeiro

const keywords = [
  "let", "const", "function", "if", "else", "while", "for", "return",
  "true", "false", "null", "undefined",
  "print", "console", "prompt", "parseInt", "parseFloat", "typeof"
];

const keywordRegex = new RegExp("^(" + keywords.join("|") + ")\\b");

// COMMENT deve vir antes de OPERATOR pra não confundir // com /
const tokenPatterns = [
  { type: "COMMENT", regex: /^\/\/[^\n]*/, ignore: true },
  { type: "KEYWORD", regex: keywordRegex },
  { type: "NUMBER", regex: /^[0-9]+(\.[0-9]+)?/ },
  { type: "IDENTIFIER", regex: /^[a-zA-Z_][a-zA-Z0-9_]*/ },
  { type: "STRING", regex: /^"([^"\n]*)"|^'([^'\n]*)'/ },
  { type: "OPERATOR", regex: /^(===|!==|==|!=|>=|<=|&&|\|\||[+\-*/%!=<>])/ },
  { type: "PUNCTUATION", regex: /^(\{|\}|\[|\]|\(|\)|;|,|\.|:)/ },
  { type: "WHITESPACE", regex: /^[ \t\r]+/, ignore: true },
];

function tokenize(input) {
  let tokens = [];
  let remaining = input;
  let line = 1;

  while (remaining.length > 0) {
    // Quebra de linha conta linha separadamente
    if (remaining.startsWith("\n")) {
      line++;
      remaining = remaining.slice(1);
      continue;
    }

    let matched = false;

    for (let pattern of tokenPatterns) {
      const match = pattern.regex.exec(remaining);
      if (match) {
        matched = true;
        if (!pattern.ignore) {
          tokens.push({ type: pattern.type, value: match[0], line });
        }
        remaining = remaining.slice(match[0].length);
        break;
      }
    }

    if (!matched) {
      const endOfLine = remaining.indexOf("\n");
      const snippet = endOfLine > 0 ? remaining.slice(0, endOfLine) : remaining.slice(0, 50);
      throw new Error(
        `Erro léxico na linha ${line}: token inválido perto de '${snippet}'`
      );
    }
  }

  return tokens;
}

module.exports = { tokenize };
