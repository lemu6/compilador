function analyzeSemantics(ast) {
  // Pilha de tabelas de símbolos para escopos
  const scopeStack = [{}]; // escopo global inicial vazio
  const functionTable = {};

  // Obter tabela atual (topo da pilha)
  function currentScope() {
    return scopeStack[scopeStack.length - 1];
  }

  // Entrar em novo escopo (empilhar)
  function enterScope() {
    scopeStack.push({});
  }

  // Sair do escopo atual (desempilhar)
  function exitScope() {
    scopeStack.pop();
  }

  // Resolver variável buscando em escopos de dentro para fora
  function resolveVariable(name) {
    for (let i = scopeStack.length - 1; i >= 0; i--) {
      if (scopeStack[i][name]) {
        return scopeStack[i][name];
      }
    }
    return null; // não encontrado
  }

  function resolveType(expr) {
    if (!expr) return null;
    if (["number", "string", "boolean"].includes(expr.type)) {
      return expr.type;
    }
    if (expr.type === "identifier") {
      const symbol = resolveVariable(expr.value);
      if (!symbol) {
        throw new Error(`Erro semântico: variável '${expr.value}' não declarada na linha ${expr.line}`);
      }
      return symbol.type;
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

  // Analisar lista de comandos, respeitando escopo
  function analyzeCommands(commands) {
    for (let cmd of commands) {
      if (!cmd) continue;

      switch (cmd.type) {
        case "varDecl":
        case "constDecl":
          if (currentScope()[cmd.name]) {
            throw new Error(`Erro semântico: variável '${cmd.name}' já declarada no escopo atual na linha ${cmd.line}`);
          }
          currentScope()[cmd.name] = { type: resolveType(cmd.value), isConst: cmd.type === "constDecl" };
          break;

        case "assignment":
          const symbol = resolveVariable(cmd.name);
          if (!symbol) {
            throw new Error(`Erro semântico: variável '${cmd.name}' não declarada antes do uso (linha ${cmd.line})`);
          }
          if (symbol.isConst) {
            throw new Error(`Erro semântico: não é permitido reatribuir constante '${cmd.name}' (linha ${cmd.line})`);
          }
          checkType(symbol.type, resolveType(cmd.value), cmd.line);
          break;

        case "userFunction":
          if (functionTable[cmd.name]) {
            throw new Error(`Erro semântico: função '${cmd.name}' já declarada na linha ${cmd.line}`);
          }
          functionTable[cmd.name] = { params: cmd.params, body: cmd.body };

          // Criar escopo para a função e parâmetros
          enterScope();
          for (const paramName of cmd.params) {
            if (currentScope()[paramName]) {
              throw new Error(`Erro semântico: parâmetro '${paramName}' já declarado na função '${cmd.name}' na linha ${cmd.line}`);
            }
            currentScope()[paramName] = { type: "unknown", isConst: false }; // tipo params pode ser genérico
          }
          analyzeCommands(cmd.body);
          exitScope();
          break;

        case "if":
          analyzeExpression(cmd.condition);
          enterScope();
          analyzeCommands(cmd.thenBlock);
          exitScope();
          if (cmd.elseBlock) {
            enterScope();
            analyzeCommands(cmd.elseBlock);
            exitScope();
          }
          break;

        case "while":
          analyzeExpression(cmd.condition);
          enterScope();
          analyzeCommands(cmd.body);
          exitScope();
          break;

        case "for":
          enterScope();
          if (cmd.init) analyzeCommands([cmd.init]);
          analyzeExpression(cmd.condition);
          analyzeExpression(cmd.next);
          analyzeCommands(cmd.body);
          exitScope();
          break;

        case "nativeCall":
          if (
            !["print", "console", "prompt", "parseInt", "parseFloat", "typeof"].includes(cmd.name)
          ) {
            throw new Error(
              `Erro semântico: função nativa '${cmd.name}' não reconhecida (linha ${cmd.line})`
            );
          }
          // Opcional: validar argumentos
          cmd.args.forEach(analyzeExpression);
          break;

      }
    }
  }

  function analyzeExpression(expr) {
    resolveType(expr);
  }

  analyzeCommands(ast);

  console.log("Programa semanticamente válido!");
}

module.exports = { analyzeSemantics };
