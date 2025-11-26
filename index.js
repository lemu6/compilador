const fs = require('fs');
const { tokenize } = require('./scanner');
const Parser = require('./parser');
const { analyzeSemantics } = require('./semantic');

const code = fs.readFileSync('codigo_exemplo.txt', 'utf8');

try {
  const tokens = tokenize(code);
  const parser = Parser(tokens);
  const ast = parser.parse();
  analyzeSemantics(ast);
} catch (err) {
  console.error("Erro:", err.message);
}
