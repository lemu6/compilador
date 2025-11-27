function Parser(tokens) {
  let current = 0;

  function peek() {
    return tokens[current];
  }

  function consume(type, value = null) {
    const token = tokens[current];
    if (!token || token.type !== type || (value !== null && token.value !== value)) {
      throw new Error(
        `Erro de sintaxe na linha ${token ? token.line : "?"}: esperado token do tipo '${type}'` +
        `${value ? " com valor '" + value + "'" : ""}, mas encontrado '${token ? token.value : "fim do arquivo"}'`
      );
    }
    current++;
    return token;
  }

  function programa() {
    const comandos = [];
    while (current < tokens.length) {
      const cmd = declaracao();
      if (cmd) comandos.push(cmd);
    }
    console.log("Programa aceito.");
    return comandos;
  }

  function declaracao() {
    let token = peek();
    if (!token) return null;

    if (token.type === "KEYWORD" && token.value === "let") {
      return varDecl();
    } else if (token.type === "KEYWORD" && token.value === "const") {
      return constDecl();
    } else if (token.type === "KEYWORD" && token.value === "function") {
      return userFunction();
    } else if (token.type === "KEYWORD" && token.value === "if") {
      return ifStatement();
    } else if (token.type === "KEYWORD" && token.value === "while") {
      return whileStatement();
    } else if (token.type === "KEYWORD" && token.value === "for") {
      return forStatement();
    } else if (token.type === "KEYWORD" && token.value === "return") {
      return returnStatement();
    } else if (
      token.type === "KEYWORD" &&
      ["print", "console", "prompt", "parseInt", "parseFloat", "typeof"].includes(token.value)
    ) {
      return funcCall();
    } else if (token.type === "IDENTIFIER") {
      return assignment();
    } else {
      throw new Error(`Declaracao desconhecida na linha ${token.line}: ${token.value}`);
    }
  }

  function varDecl() {
    const tkLet = consume("KEYWORD", "let");
    const nome = consume("IDENTIFIER");
    consume("OPERATOR", "=");
    const expr = expression();
    consume("PUNCTUATION", ";");
    return { type: "varDecl", name: nome.value, value: expr, line: tkLet.line };
  }

  function constDecl() {
    const tkConst = consume("KEYWORD", "const");
    const nome = consume("IDENTIFIER");
    consume("OPERATOR", "=");
    const expr = expression();
    consume("PUNCTUATION", ";");
    return { type: "constDecl", name: nome.value, value: expr, line: tkConst.line };
  }

  function assignment() {
    const nome = consume("IDENTIFIER");
    consume("OPERATOR", "=");
    const expr = expression();
    consume("PUNCTUATION", ";");
    return { type: "assignment", name: nome.value, value: expr, line: nome.line };
  }

  function userFunction() {
    const tkFn = consume("KEYWORD", "function");
    const nome = consume("IDENTIFIER");
    consume("PUNCTUATION", "(");
    const params = [];
    if (peek() && peek().type === "IDENTIFIER") {
      params.push(consume("IDENTIFIER").value);
      while (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
        consume("PUNCTUATION", ",");
        params.push(consume("IDENTIFIER").value);
      }
    }
    consume("PUNCTUATION", ")");
    const body = bloco();
    return { type: "userFunction", name: nome.value, params, body, line: tkFn.line };
  }

  function ifStatement() {
    const tkIf = consume("KEYWORD", "if");
    consume("PUNCTUATION", "(");
    const cond = expression();
    consume("PUNCTUATION", ")");
    const thenBlock = bloco();
    let elseBlock = null;
    if (peek() && peek().type === "KEYWORD" && peek().value === "else") {
      consume("KEYWORD", "else");
      elseBlock = bloco();
    }
    return { type: "if", condition: cond, thenBlock, elseBlock, line: tkIf.line };
  }

  function whileStatement() {
    const tkWhile = consume("KEYWORD", "while");
    consume("PUNCTUATION", "(");
    const cond = expression();
    consume("PUNCTUATION", ")");
    const body = bloco();
    return { type: "while", condition: cond, body, line: tkWhile.line };
  }

  function forStatement() {
    const tkFor = consume("KEYWORD", "for");
    consume("PUNCTUATION", "(");
    let init = null;
    if (peek().type === "KEYWORD" && peek().value === "let") init = varDecl();
    else if (peek().type === "KEYWORD" && peek().value === "const") init = constDecl();
    else if (peek().type === "IDENTIFIER") init = assignment();
    const cond = expression();
    consume("PUNCTUATION", ";");
    const next = expression();
    consume("PUNCTUATION", ")");
    const body = bloco();
    return { type: "for", init, condition: cond, next, body, line: tkFor.line };
  }

  function returnStatement() {
    const tkRet = consume("KEYWORD", "return");
    let value = null;
    if (!(peek().type === "PUNCTUATION" && peek().value === ";")) {
      value = expression();
    }
    consume("PUNCTUATION", ";");
    return { type: "returnStmt", value, line: tkRet.line };
  }

  function funcCall() {
    const fname = consume("KEYWORD");
    consume("PUNCTUATION", "(");
    let args = [];
    if (!(peek().type === "PUNCTUATION" && peek().value === ")")) {
      args.push(expression());
      while (peek().type === "PUNCTUATION" && peek().value === ",") {
        consume("PUNCTUATION", ",");
        args.push(expression());
      }
    }
    consume("PUNCTUATION", ")");
    consume("PUNCTUATION", ";");
    return { type: "nativeCall", name: fname.value, args, line: fname.line };
  }

  function bloco() {
    consume("PUNCTUATION", "{");
    const body = [];
    while (peek() && !(peek().type === "PUNCTUATION" && peek().value === "}")) {
      body.push(declaracao());
    }
    consume("PUNCTUATION", "}");
    return body;
  }

  // EXPRESSÕES

  function expression() {
    const token = peek();
    if (!token) {
      throw new Error("Expressão inválida no fim do arquivo");
    }

    // Literais number
    if (token.type === "NUMBER") {
      current++;
      let left = { type: "number", value: Number(token.value), line: token.line };
      while (peek() && peek().type === "OPERATOR") {
        const op = consume("OPERATOR");
        const right = expression();
        left = { type: "operation", operator: op.value, left, right, line: op.line };
      }
      return left;
    }

    // Literais string
    if (token.type === "STRING") {
      current++;
      let left = { type: "string", value: token.value, line: token.line };
      while (peek() && peek().type === "OPERATOR") {
        const op = consume("OPERATOR");
        const right = expression();
        left = { type: "operation", operator: op.value, left, right, line: op.line };
      }
      return left;
    }

    // boolean
    if (token.type === "KEYWORD" && (token.value === "true" || token.value === "false")) {
      current++;
      let left = { type: "boolean", value: token.value === "true", line: token.line };
      while (peek() && peek().type === "OPERATOR") {
        const op = consume("OPERATOR");
        const right = expression();
        left = { type: "operation", operator: op.value, left, right, line: op.line };
      }
      return left;
    }

    // null
    if (token.type === "KEYWORD" && token.value === "null") {
      current++;
      return { type: "null", value: null, line: token.line };
    }

    // undefined
    if (token.type === "KEYWORD" && token.value === "undefined") {
      current++;
      return { type: "undefined", value: undefined, line: token.line };
    }


    // Identificador simples (sem acesso ainda)
    if (token.type === "IDENTIFIER") {
      current++;
      let left = { type: "identifier", value: token.value, line: token.line };
      while (peek() && peek().type === "OPERATOR") {
        const op = consume("OPERATOR");
        const right = expression();
        left = { type: "operation", operator: op.value, left, right, line: op.line };
      }
      return left;
    }

    // Array literal
    if (token.type === "PUNCTUATION" && token.value === "[") {
      return arrayExpression();
    }

    // Object literal
    if (token.type === "PUNCTUATION" && token.value === "{") {
      return objectExpression();
    }

    throw new Error(
      `Expressão inválida na linha ${token ? token.line : "?"}: ${token ? token.value : "erro"}`
    );
  }

  function arrayExpression() {
    const tkArr = consume("PUNCTUATION", "[");
    let elements = [];
    if (!(peek().type === "PUNCTUATION" && peek().value === "]")) {
      elements.push(expression());
      while (peek().type === "PUNCTUATION" && peek().value === ",") {
        consume("PUNCTUATION", ",");
        elements.push(expression());
      }
    }
    consume("PUNCTUATION", "]");
    return { type: "arrayLiteral", elements, line: tkArr.line };
  }

  function objectExpression() {
    const tkObj = consume("PUNCTUATION", "{");
    let fields = [];
    if (peek().type === "IDENTIFIER") {
      let name = consume("IDENTIFIER").value;
      consume("PUNCTUATION", ":");
      let value = expression();
      fields.push({ name, value });
      while (peek().type === "PUNCTUATION" && peek().value === ",") {
        consume("PUNCTUATION", ",");
        name = consume("IDENTIFIER").value;
        consume("PUNCTUATION", ":");
        value = expression();
        fields.push({ name, value });
      }
    }
    consume("PUNCTUATION", "}");
    return { type: "objectLiteral", fields, line: tkObj.line };
  }

  // API externa
  return { parse: programa };
}

module.exports = Parser;
