// codegen.js

function generateProgram(ast) {
  return ast.map(generateCommand).join("\n");
}

function generateCommand(cmd) {
  switch (cmd.type) {
    case "varDecl":
      return `let ${cmd.name} = ${generateExpr(cmd.value)};`;

    case "constDecl":
      return `const ${cmd.name} = ${generateExpr(cmd.value)};`;

    case "assignment":
      return `${cmd.name} = ${generateExpr(cmd.value)};`;

    case "userFunction": {
      const params = cmd.params.join(", ");
      const body = cmd.body.map(generateCommand).join("\n");
      return `function ${cmd.name}(${params}) {\n${indent(body)}\n}`;
    }

    case "if": {
      const cond = generateExpr(cmd.condition);
      const thenCode = cmd.thenBlock.map(generateCommand).join("\n");
      let code = `if (${cond}) {\n${indent(thenCode)}\n}`;
      if (cmd.elseBlock) {
        const elseCode = cmd.elseBlock.map(generateCommand).join("\n");
        code += ` else {\n${indent(elseCode)}\n}`;
      }
      return code;
    }

    case "while": {
      const cond = generateExpr(cmd.condition);
      const body = cmd.body.map(generateCommand).join("\n");
      return `while (${cond}) {\n${indent(body)}\n}`;
    }

    case "for": {
      // versão bem simples: gera init/cond/next como JS direto
      const init = cmd.init ? generateCommand(cmd.init).replace(/;$/, "") : "";
      const cond = generateExpr(cmd.condition);
      const next = generateExpr(cmd.next);
      const body = cmd.body.map(generateCommand).join("\n");
      return `for (${init}; ${cond}; ${next}) {\n${indent(body)}\n}`;
    }
    case "functionCall":
      return `${cmd.name}(${cmd.args.map(generateExpr).join(", ")});`;

    case "returnStmt":
      if (cmd.value) return `return ${generateExpr(cmd.value)};`;
      return `return;`;

    case "nativeCall":
      return generateNativeCall(cmd) + ";";

    case "userCall":
      return `${cmd.name}(${cmd.args.map(generateExpr).join(", ")});`;

    default:
      throw new Error(`codegen: comando não suportado: ${cmd.type}`);
  }
}

function generateNativeCall(cmd) {
  const args = cmd.args.map(generateExpr).join(", ");
  switch (cmd.name) {
    case "print":
    case "console":
      return `console.log(${args})`;
    case "prompt":
      return `prompt(${args})`;
    case "parseInt":
      return `parseInt(${args})`;
    case "parseFloat":
      return `parseFloat(${args})`;
    case "typeof":
      return `typeof ${args}`;
    default:
      throw new Error(`codegen: função nativa não suportada: ${cmd.name}`);
  }
}

function generateExpr(expr) {
  switch (expr.type) {
    case "number":
      return String(expr.value);

    case "string":
      // expr.value já vem com aspas do scanner
      return expr.value;

    case "boolean":
      return expr.value ? "true" : "false";

    case "null":
      return "null";

    case "undefined":
      return "undefined";

    case "identifier":
      return expr.value;

    case "operation":
      return `(${generateExpr(expr.left)} ${expr.operator} ${generateExpr(expr.right)})`;

    case "arrayLiteral":
      return `[${expr.elements.map(generateExpr).join(", ")}]`;

    case "objectLiteral":
      return `{ ${expr.fields
        .map(f => `${f.name}: ${generateExpr(f.value)}`)
        .join(", ")} }`;

    case "arrayAccess":
      // parser: { type: "arrayAccess", array: token.value, index, line }
      return `${expr.array}[${generateExpr(expr.index)}]`;

    case "functionCall":
      // parser: { type: "functionCall", name, args, line }
      return `${expr.name}(${expr.args.map(generateExpr).join(", ")})`;

    case "nativeCall":
      return generateNativeCall(expr);

    case "unaryOperation":
      return `(${expr.operator}${generateExpr(expr.operand)})`;

    case "assignment":
      return `${expr.name} = ${generateExpr(expr.value)}`;

    default:
      throw new Error(`codegen: expressão não suportada: ${expr.type}`);
  }
}

// utilitário para identar blocos
function indent(text) {
  return text
    .split("\n")
    .map(line => (line.trim() ? "  " + line : line))
    .join("\n");
}

module.exports = { generateProgram };
