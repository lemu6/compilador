const keywords = ["let", "const", "function", "if", "else", "while", "for", "return", "true", "false", "null", "undefined", "print", "console", "prompt", "parseInt", "parseFloat", "typeof"];
const tokenPatterns = [
  {type: "KEYWORD", regex: new RegExp("^(" + keywords.join("|") + ")\\b")},
  {type: "NUMBER", regex: /^[0-9]+(\.[0-9]+)?/},
  {type: "IDENTIFIER", regex: /^[a-zA-Z_][a-zA-Z0-9_]*/},
  {type: "STRING", regex: /^"([^"]*)"|^'([^']*)'/},
  {type: "OPERATOR", regex: /^(\+|\-|\*|\/|%|==|!=|===|!==|<=|>=|<|>|\|\||&&|!|=)/},
  {type: "PUNCTUATION", regex: /^(\{|\}|\(|\)|;|,|\.)/},
  {type: "WHITESPACE", regex: /^\s+/, ignore: true}
];

function tokenize(input) {
  let tokens = [];
  let remaining = input;
  let line = 1;

  while (remaining.length > 0) {
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
          tokens.push({type: pattern.type, value: match[0], line: line});
        }
        remaining = remaining.slice(match[0].length);
        break;
      }
    }
    if (!matched) {
      throw new Error("Token inválido encontrado na linha " + line + ": " + remaining.slice(0, 10));
    }
  }
  return tokens;
}

module.exports = { tokenize };
