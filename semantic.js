function analyzeSemantics(ast) {
  const symbolTable = {};
  const functionTable = {};

  function resolveType(expr) {
    if (!expr) return null;
    if (["number", "string", "boolean"].includes(expr.type)) {
      return expr.type;
    }
    if (expr.type === "identifier") {
      if (!symbolTable[expr.value]) {
        throw new Error(`Erro semântico: variável '${expr.value}' não declarada na linha ${expr.line}`);
      }
      return symbolTable[expr.value].type;
    }
    if (expr.type === "operation") {
      const leftType = resolveType(expr.left);
      const rightType = resolveType(expr.right);
      if (leftType !== rightType) {
        throw new Error(`Erro semântico: operação '${expr.operator}' entre tipos incompatíveis (${leftType} e ${rightType}) na linha ${expr.line}`);
      }
      if (expr.operator.match(/[\+\-\*\/%]/) && leftType !== "number") {
        throw new Error(`Erro semântico: operação aritmética exige números (encontrado: ${leftType}) na linha ${expr.line}`);
      }
      return leftType;
    }
    return expr.type;
  }

  function checkType(expected, actual, line) {
    if (expected !== actual) {
      throw new Error(`Erro semântico: esperado tipo '${expected}', encontrado '${actual}' na linha ${line}`);
    }
  }

  for (let cmd of ast) {
    if (!cmd) continue;

    if (cmd.type === "varDecl") {
      const nome = cmd.name;
      if (symbolTable[nome]) {
        throw new Error(`Erro semântico: variável '${nome}' já declarada na linha ${cmd.line}`);
      }
      symbolTable[nome] = { type: resolveType(cmd.value), isConst: false };
    } else if (cmd.type === "constDecl") {
      const nome = cmd.name;
      if (symbolTable[nome]) {
        throw new Error(`Erro semântico: constante '${nome}' já declarada na linha ${cmd.line}`);
      }
      symbolTable[nome] = { type: resolveType(cmd.value), isConst: true };
    } else if (cmd.type === "assignment") {
      const nome = cmd.name;
      if (!symbolTable[nome]) {
        throw new Error(`Erro semântico: variável '${nome}' não declarada antes do uso (linha ${cmd.line})`);
      }
      if (symbolTable[nome].isConst) {
        throw new Error(`Erro semântico: não é permitido reatribuir constante '${nome}' (linha ${cmd.line})`);
      }
      checkType(symbolTable[nome].type, resolveType(cmd.value), cmd.line);
    } else if (cmd.type === "userFunction") {
      const fname = cmd.name;
      if (functionTable[fname]) {
        throw new Error(`Erro semântico: função '${fname}' já declarada na linha ${cmd.line}`);
      }
      functionTable[fname] = { params: cmd.params, body: cmd.body };
      // Poderia analisar corpo da função recursivamente aqui
    } else if (cmd.type === "nativeCall") {
      if (!["print", "console", "prompt"].includes(cmd.name)) {
        throw new Error(`Erro semântico: função nativa '${cmd.name}' não reconhecida (linha ${cmd.line})`);
      }
      // Opcional: checar argumentos da função nativa
    }
    // Extenda para arrays, objetos, laços e outras estruturas conforme a necessidade
  }

  console.log("Programa semanticamente válido!");
}

module.exports = { analyzeSemantics };
