const fs = require('fs');
const { tokenize } = require('./scanner');

const code = fs.readFileSync('codigo_exemplo.txt', 'utf8'); // Exemplo de arquivo código-fonte
try {
  const tokens = tokenize(code);
  console.log(tokens);
} catch (err) {
  console.error("Erro:", err.message);
}
