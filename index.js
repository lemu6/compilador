// index.js - Ponto de entrada do compilador
// Orquestra: léxico → sintático → semântico → codegen

const fs = require('fs');
const { tokenize } = require('./scanner');
const Parser = require('./parser');
const { analyzeSemantics } = require('./semantic');
const { generateProgram } = require('./codegen'); // back-end JS
const { generateJasminProgram } = require('./codegen_jasmin'); // back-end Jasmin

// arquivo de entrada padrão
const arquivo = process.argv[2] || 'codigo_teste_completo.txt';

// valida se o arquivo existe
if (!fs.existsSync(arquivo)) {
  console.error(`\nErro: arquivo '${arquivo}' não encontrado.`);
  console.error('Uso: node index.js <arquivo>\n');
  process.exit(1);
}

// lê código-fonte
const code = fs.readFileSync(arquivo, 'utf8');
console.log(`\nCompilando: ${arquivo}\n`);

try {
  // FRONT-END: léxico, sintático, semântico
  const tokens = tokenize(code);
  const parser = Parser(tokens);
  const ast = parser.parse();
  analyzeSemantics(ast);

  console.log('Programa aceito.');
  console.log('Programa semanticamente válido!');

  // BACK-END: geração de código JavaScript
  const jsCode = generateProgram(ast);

  // garante que a pasta out/ exista
  if (!fs.existsSync('./out')) {
    fs.mkdirSync('./out');
  }

  // grava o arquivo JS gerado
  fs.writeFileSync('./out/out.js', jsCode, 'utf8');
  console.log('\nCódigo JS gerado em out/out.js');

  // BACK-END: geração de código Jasmin (JVM)
  const jasminCode = generateJasminProgram(ast, 'Main');
  fs.writeFileSync('./out/out.j', jasminCode, 'utf8');
  console.log('Código Jasmin gerado em out/out.j\n');
} catch (err) {
  console.error(`\n=== Erro ===\n${err.message}\n============\n`);
  process.exit(1);
}
