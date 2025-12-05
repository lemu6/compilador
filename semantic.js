// semantic.js - Analisador semântico
// Escopo via pilha, verifica declarações e tipos básicos

function analyzeSemantics(ast) {
  const scopeStack = [{}];   // pilha de escopos (cada {} é um escopo)
  const functionTable = {};  // tabela de funções do usuário
  
  // Hoisting: registra funções antes de analisar o resto
  for (let cmd of ast) {
    if (cmd && cmd.type === "userFunction") {
      if (functionTable[cmd.name]) {
        throw new Error(`Erro semântico: função '${cmd.name}' já declarada na linha ${cmd.line}`);
      }
      functionTable[cmd.name] = { 
        params: cmd.params, 
        body: cmd.body, 
        returnType: "unknown",
        line: cmd.line 
      };
    }
  }

  function currentScope() {
    return scopeStack[scopeStack.length - 1];
  }

  function enterScope() {
    scopeStack.push({});
  }

  function exitScope() {
    scopeStack.pop();
  }

  // Busca variável do escopo mais interno pro mais externo
  function resolveVariable(name) {
    for (let i = scopeStack.length - 1; i >= 0; i--) {
      if (scopeStack[i][name]) {
        return scopeStack[i][name];
      }
    }
    return null;
  }

  function resolveType(expr) {
    if (!expr) return null;
    if (["number", "string", "boolean"].includes(expr.type)) {
      return expr.type;
    }
    if (expr.type === "null") {
      return "null";
    }
    if (expr.type === "undefined") {
      return "undefined";
    }
    if (expr.type === "identifier") {
      const symbol = resolveVariable(expr.value);
      if (!symbol) {
        throw new Error(`Erro semântico: variável '${expr.value}' não declarada na linha ${expr.line}`);
      }
      return symbol.type;
    }
    if (expr.type === "functionCall") {
      const func = functionTable[expr.name];
      if (!func) {
        throw new Error(`Erro semântico: função '${expr.name}' não declarada na linha ${expr.line}`);
      }
      if (expr.args.length !== func.params.length) {
        throw new Error(`Erro semântico: função '${expr.name}' esperava ${func.params.length} argumento(s), mas recebeu ${expr.args.length} na linha ${expr.line}`);
      }
      expr.args.forEach(arg => resolveType(arg));
      return func.returnType;
    }
    if (expr.type === "nativeCall") {
      expr.args.forEach(arg => resolveType(arg));
      if (expr.name === "parseInt" || expr.name === "parseFloat") return "number";
      if (expr.name === "typeof") return "string";
      if (expr.name === "prompt") return "string";
      return "unknown";
    }
    if (expr.type === "operation") {
      const leftTypeResult = resolveType(expr.left);
      const rightTypeResult = resolveType(expr.right);
      const leftType = typeof leftTypeResult === "object" ? leftTypeResult.baseType : leftTypeResult;
      const rightType = typeof rightTypeResult === "object" ? rightTypeResult.baseType : rightTypeResult;
      
      if (["==", "===", "!=", "!==", ">", "<", ">=", "<=", "&&", "||"].includes(expr.operator)) {
        return "boolean";
      }
      if (leftType !== rightType && leftType !== "unknown" && rightType !== "unknown") {
        throw new Error(`Erro semântico: operação '${expr.operator}' entre tipos incompatíveis (${leftType} e ${rightType}) na linha ${expr.line}`);
      }
      if (expr.operator.match(/[\+\-\*\/%]/) && leftType !== "number" && leftType !== "unknown") {
        throw new Error(`Erro semântico: operação aritmética exige números (encontrado: ${leftType}) na linha ${expr.line}`);
      }
      return leftType;
    }
    if (expr.type === "unaryOperation") {
      const operandType = resolveType(expr.operand);
      if (expr.operator === "!") return "boolean";
      return typeof operandType === "object" ? operandType.baseType : operandType;
    }
    if (expr.type === "arrayLiteral") {
      if (expr.elements.length > 0) {
        const elementTypes = expr.elements.map(el => {
          const t = resolveType(el);
          return typeof t === "object" ? t.baseType : t;
        });
        const firstType = elementTypes[0];
        const isHomogeneous = elementTypes.every(t => t === firstType);
        // array<tipo> se homogêneo, array<mixed> se misturado
        return { 
          baseType: isHomogeneous ? `array<${firstType}>` : "array<mixed>", 
          size: expr.elements.length 
        };
      }
      return { baseType: "array<unknown>", size: 0 };
    }
    if (expr.type === "arrayAccess") {
      const symbol = resolveVariable(expr.array);
      if (!symbol) {
        throw new Error(`Erro semântico: variável '${expr.array}' não declarada na linha ${expr.line}`);
      }
      const symbolType = symbol.type;
      const arrayType = typeof symbolType === "object" ? symbolType.baseType : symbolType;
      if (!arrayType.startsWith("array<")) {
        throw new Error(`Erro semântico: '${expr.array}' não é um array na linha ${expr.line}`);
      }
      const indexType = resolveType(expr.index);
      const actualIndexType = typeof indexType === "object" ? indexType.baseType : indexType;
      if (actualIndexType !== "number") {
        throw new Error(`Erro semântico: índice de array deve ser um número, encontrado '${actualIndexType}' na linha ${expr.line}`);
      }
      // Bounds check só funciona com índice literal
      if (expr.index.type === "number" && typeof symbolType === "object" && symbolType.size !== undefined) {
        const idx = expr.index.value;
        if (idx < 0 || idx >= symbolType.size) {
          throw new Error(`Erro semântico: índice ${idx} fora dos limites do array '${expr.array}' (tamanho: ${symbolType.size}) na linha ${expr.line}`);
        }
      }
      return arrayType.match(/array<(.+)>/)[1];
    }
    if (expr.type === "objectLiteral") {
      return "object";
    }
    return expr.type;
  }

  function analyzeCommands(commands) {
    for (let cmd of commands) {
      if (!cmd) continue;

      switch (cmd.type) {
        case "varDecl":
        case "constDecl":
          if (currentScope()[cmd.name]) {
            throw new Error(`Erro semântico: variável '${cmd.name}' já declarada no escopo atual na linha ${cmd.line}`);
          }
          const varType = resolveType(cmd.value);
          currentScope()[cmd.name] = { type: varType, isConst: cmd.type === "constDecl" };
          break;

        case "assignment":
          const symbol = resolveVariable(cmd.name);
          if (!symbol) {
            throw new Error(`Erro semântico: variável '${cmd.name}' não declarada antes do uso (linha ${cmd.line})`);
          }
          if (symbol.isConst) {
            throw new Error(`Erro semântico: não é permitido reatribuir constante '${cmd.name}' (linha ${cmd.line})`);
          }
          const assignType = resolveType(cmd.value);
          const expectedBase = typeof symbol.type === "object" ? symbol.type.baseType : symbol.type;
          const actualBase = typeof assignType === "object" ? assignType.baseType : assignType;
          if (expectedBase !== actualBase) {
            throw new Error(`Erro semântico: esperado tipo '${expectedBase}', encontrado '${actualBase}' na linha ${cmd.line}`);
          }
          break;

        case "userFunction":
          enterScope();
          for (const paramName of cmd.params) {
            if (currentScope()[paramName]) {
              throw new Error(`Erro semântico: parâmetro '${paramName}' já declarado na função '${cmd.name}' na linha ${cmd.line}`);
            }
            currentScope()[paramName] = { type: "unknown", isConst: false };
          }
          analyzeCommands(cmd.body);
          exitScope();
          break;

        case "functionCall":
          const funcDef = functionTable[cmd.name];
          if (!funcDef) {
            throw new Error(`Erro semântico: função '${cmd.name}' não declarada na linha ${cmd.line}`);
          }
          if (cmd.args.length !== funcDef.params.length) {
            throw new Error(`Erro semântico: função '${cmd.name}' esperava ${funcDef.params.length} argumento(s), mas recebeu ${cmd.args.length} na linha ${cmd.line}`);
          }
          cmd.args.forEach(analyzeExpression);
          break;

        case "returnStmt":
          if (cmd.value) {
            analyzeExpression(cmd.value);
          }
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
          if (!["print", "console", "prompt", "parseInt", "parseFloat", "typeof"].includes(cmd.name)) {
            throw new Error(`Erro semântico: função nativa '${cmd.name}' não reconhecida (linha ${cmd.line})`);
          }
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
