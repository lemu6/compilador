// codegen_jasmin.js
// Back-end que gera código Jasmin (JVM bytecode) a partir da AST

function generateJasminProgram(ast, className = "Main") {
  // Mapeamento de variáveis para slots da JVM
  // slot 0 = args (String[]) do main, variáveis locais começam no slot 1
  const varSlots = {};
  let nextSlot = 1;

  // Contador de labels para saltos
  let labelCounter = 0;
  function newLabel(prefix = "L") {
    return `${prefix}${labelCounter++}`;
  }

  // Registra variável e retorna seu slot
  function getOrCreateSlot(name) {
    if (varSlots[name] === undefined) {
      varSlots[name] = nextSlot++;
    }
    return varSlots[name];
  }

  function getSlot(name) {
    if (varSlots[name] === undefined) {
      throw new Error(`codegen_jasmin: variável '${name}' não declarada`);
    }
    return varSlots[name];
  }

  // Gera instruções para o corpo do main
  const bodyLines = [];

  function emit(line) {
    bodyLines.push(line);
  }

  // Gera código para um comando
  function genCommand(cmd) {
    switch (cmd.type) {
      case "varDecl":
      case "constDecl": {
        const slot = getOrCreateSlot(cmd.name);
        genExpr(cmd.value);
        emit(`  istore ${slot}`);
        break;
      }

      case "assignment": {
        const slot = getSlot(cmd.name);
        genExpr(cmd.value);
        emit(`  istore ${slot}`);
        break;
      }

      case "if": {
        const labelElse = newLabel("ELSE");
        const labelEnd = newLabel("ENDIF");

        genCondition(cmd.condition, labelElse);
        // then block
        cmd.thenBlock.forEach(genCommand);
        if (cmd.elseBlock) {
          emit(`  goto ${labelEnd}`);
        }
        emit(`${labelElse}:`);
        if (cmd.elseBlock) {
          cmd.elseBlock.forEach(genCommand);
          emit(`${labelEnd}:`);
        }
        break;
      }

      case "while": {
        const labelStart = newLabel("WHILE");
        const labelEnd = newLabel("ENDWHILE");

        emit(`${labelStart}:`);
        genCondition(cmd.condition, labelEnd);
        cmd.body.forEach(genCommand);
        emit(`  goto ${labelStart}`);
        emit(`${labelEnd}:`);
        break;
      }

      case "for": {
        // for (init; cond; next) { body }
        const labelStart = newLabel("FOR");
        const labelEnd = newLabel("ENDFOR");

        if (cmd.init) genCommand(cmd.init);
        emit(`${labelStart}:`);
        genCondition(cmd.condition, labelEnd);
        cmd.body.forEach(genCommand);
        // next pode ser assignment ou expressão
        if (cmd.next) {
          if (cmd.next.type === "assignment") {
            genCommand(cmd.next);
          } else {
            // expressão simples, gera e descarta resultado
            genExpr(cmd.next);
            emit("  pop");
          }
        }
        emit(`  goto ${labelStart}`);
        emit(`${labelEnd}:`);
        break;
      }

      case "nativeCall": {
        if (cmd.name === "print" || cmd.name === "console") {
          emit("  getstatic java/lang/System/out Ljava/io/PrintStream;");
          if (cmd.args.length > 0) {
            genExpr(cmd.args[0]);
          } else {
            emit("  iconst_0");
          }
          emit("  invokevirtual java/io/PrintStream/println(I)V");
        }
        // outras nativas ignoradas por ora
        break;
      }

      case "functionCall": {
        // chamadas de função do usuário não suportadas ainda
        // apenas descartamos por simplicidade
        break;
      }

      case "userFunction": {
        // funções do usuário não suportadas ainda
        break;
      }

      case "returnStmt": {
        // return dentro do main: simplesmente ignora valor e retorna
        emit("  return");
        break;
      }

      default:
        // ignora comandos não suportados
        break;
    }
  }

  // Gera código para expressão (deixa resultado no topo da pilha)
  function genExpr(expr) {
    switch (expr.type) {
      case "number": {
        const val = Math.floor(expr.value);
        if (val >= -1 && val <= 5) {
          emit(`  iconst_${val < 0 ? "m1" : val}`);
        } else if (val >= -128 && val <= 127) {
          emit(`  bipush ${val}`);
        } else if (val >= -32768 && val <= 32767) {
          emit(`  sipush ${val}`);
        } else {
          emit(`  ldc ${val}`);
        }
        break;
      }

      case "boolean":
        emit(expr.value ? "  iconst_1" : "  iconst_0");
        break;

      case "null":
      case "undefined":
        emit("  iconst_0");
        break;

      case "identifier": {
        const slot = getSlot(expr.value);
        emit(`  iload ${slot}`);
        break;
      }

      case "operation": {
        genExpr(expr.left);
        genExpr(expr.right);
        switch (expr.operator) {
          case "+":
            emit("  iadd");
            break;
          case "-":
            emit("  isub");
            break;
          case "*":
            emit("  imul");
            break;
          case "/":
            emit("  idiv");
            break;
          case "%":
            emit("  irem");
            break;
          case "==":
          case "===": {
            const labelTrue = newLabel("EQ_TRUE");
            const labelEnd = newLabel("EQ_END");
            emit(`  if_icmpeq ${labelTrue}`);
            emit("  iconst_0");
            emit(`  goto ${labelEnd}`);
            emit(`${labelTrue}:`);
            emit("  iconst_1");
            emit(`${labelEnd}:`);
            break;
          }
          case "!=":
          case "!==": {
            const labelTrue = newLabel("NE_TRUE");
            const labelEnd = newLabel("NE_END");
            emit(`  if_icmpne ${labelTrue}`);
            emit("  iconst_0");
            emit(`  goto ${labelEnd}`);
            emit(`${labelTrue}:`);
            emit("  iconst_1");
            emit(`${labelEnd}:`);
            break;
          }
          case "<": {
            const labelTrue = newLabel("LT_TRUE");
            const labelEnd = newLabel("LT_END");
            emit(`  if_icmplt ${labelTrue}`);
            emit("  iconst_0");
            emit(`  goto ${labelEnd}`);
            emit(`${labelTrue}:`);
            emit("  iconst_1");
            emit(`${labelEnd}:`);
            break;
          }
          case "<=": {
            const labelTrue = newLabel("LE_TRUE");
            const labelEnd = newLabel("LE_END");
            emit(`  if_icmple ${labelTrue}`);
            emit("  iconst_0");
            emit(`  goto ${labelEnd}`);
            emit(`${labelTrue}:`);
            emit("  iconst_1");
            emit(`${labelEnd}:`);
            break;
          }
          case ">": {
            const labelTrue = newLabel("GT_TRUE");
            const labelEnd = newLabel("GT_END");
            emit(`  if_icmpgt ${labelTrue}`);
            emit("  iconst_0");
            emit(`  goto ${labelEnd}`);
            emit(`${labelTrue}:`);
            emit("  iconst_1");
            emit(`${labelEnd}:`);
            break;
          }
          case ">=": {
            const labelTrue = newLabel("GE_TRUE");
            const labelEnd = newLabel("GE_END");
            emit(`  if_icmpge ${labelTrue}`);
            emit("  iconst_0");
            emit(`  goto ${labelEnd}`);
            emit(`${labelTrue}:`);
            emit("  iconst_1");
            emit(`${labelEnd}:`);
            break;
          }
          case "&&": {
            // ambos já estão na pilha como 0/1
            emit("  iand");
            break;
          }
          case "||": {
            emit("  ior");
            break;
          }
          default:
            throw new Error(`codegen_jasmin: operador não suportado: ${expr.operator}`);
        }
        break;
      }

      case "unaryOperation": {
        if (expr.operator === "!") {
          genExpr(expr.operand);
          // inverte 0<->1
          const labelZero = newLabel("NOT_ZERO");
          const labelEnd = newLabel("NOT_END");
          emit(`  ifeq ${labelZero}`);
          emit("  iconst_0");
          emit(`  goto ${labelEnd}`);
          emit(`${labelZero}:`);
          emit("  iconst_1");
          emit(`${labelEnd}:`);
        } else {
          genExpr(expr.operand);
        }
        break;
      }

      case "nativeCall": {
        // Funções nativas que retornam int
        if (expr.name === "parseInt" || expr.name === "parseFloat") {
          // simplificação: assume que argumento já é int
          if (expr.args.length > 0) {
            genExpr(expr.args[0]);
          } else {
            emit("  iconst_0");
          }
        } else {
          emit("  iconst_0");
        }
        break;
      }

      case "functionCall": {
        // chamadas de função do usuário retornam 0 por simplificação
        emit("  iconst_0");
        break;
      }

      case "arrayLiteral":
      case "objectLiteral":
      case "arrayAccess":
        // não suportado ainda, empilha 0
        emit("  iconst_0");
        break;

      case "string":
        // strings não suportadas em int, empilha 0
        emit("  iconst_0");
        break;

      case "assignment": {
        // usado em for: i = i + 1
        const slot = getSlot(expr.name);
        genExpr(expr.value);
        emit("  dup"); // mantém valor na pilha como resultado
        emit(`  istore ${slot}`);
        break;
      }

      default:
        emit("  iconst_0");
        break;
    }
  }

  // Gera condição que salta para labelFalse se falsa
  function genCondition(cond, labelFalse) {
    if (cond.type === "operation") {
      const op = cond.operator;
      // Otimização: comparação direta sem empilhar 0/1
      if (["<", "<=", ">", ">=", "==", "===", "!=", "!=="].includes(op)) {
        genExpr(cond.left);
        genExpr(cond.right);
        switch (op) {
          case "<":
            emit(`  if_icmpge ${labelFalse}`);
            break;
          case "<=":
            emit(`  if_icmpgt ${labelFalse}`);
            break;
          case ">":
            emit(`  if_icmple ${labelFalse}`);
            break;
          case ">=":
            emit(`  if_icmplt ${labelFalse}`);
            break;
          case "==":
          case "===":
            emit(`  if_icmpne ${labelFalse}`);
            break;
          case "!=":
          case "!==":
            emit(`  if_icmpeq ${labelFalse}`);
            break;
        }
        return;
      }
    }
    // Caso geral: avalia expressão e testa se == 0
    genExpr(cond);
    emit(`  ifeq ${labelFalse}`);
  }

  // Processa todos os comandos
  ast.forEach(genCommand);

  // Calcula limite de stack (estimativa segura) e locals
  const stackLimit = 100; // valor seguro
  const localsLimit = nextSlot;

  // Monta o arquivo Jasmin
  const lines = [
    `.class public ${className}`,
    `.super java/lang/Object`,
    "",
    "; construtor padrão",
    ".method public <init>()V",
    "  aload_0",
    "  invokespecial java/lang/Object/<init>()V",
    "  return",
    ".end method",
    "",
    "; método main",
    ".method public static main([Ljava/lang/String;)V",
    `  .limit stack ${stackLimit}`,
    `  .limit locals ${localsLimit}`,
    "",
    ...bodyLines,
    "",
    "  return",
    ".end method",
  ];

  return lines.join("\n");
}

module.exports = { generateJasminProgram };
