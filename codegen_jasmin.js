// codegen_jasmin.js - Gerador de bytecode JVM 
// Gera código Jasmin (.j) a partir da AST

function generateJasminProgram(ast, className = "Main") {
  // ========== FASE 1: Coletar funções do usuário ==========
  const userFunctions = {};
  for (const cmd of ast) {
    if (cmd && cmd.type === "userFunction") {
      userFunctions[cmd.name] = {
        params: cmd.params,
        body: cmd.body,
        paramCount: cmd.params.length
      };
    }
  }

  // ========== ESTADO GLOBAL ==========
  let labelCounter = 0;
  function newLabel(prefix = "L") {
    return `${prefix}${labelCounter++}`;
  }

  // Métodos gerados (main + funções do usuário)
  const methods = [];

  // ========== GERAR MAIN ==========
  const mainCode = generateMethod("main", [], ast.filter(cmd => cmd && cmd.type !== "userFunction"), true);
  methods.push(mainCode);

  // ========== GERAR FUNÇÕES DO USUÁRIO ==========
  for (const [name, func] of Object.entries(userFunctions)) {
    const funcCode = generateFunction(name, func.params, func.body);
    methods.push(funcCode);
  }

  // ========== MONTAR ARQUIVO JASMIN ==========
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
    ...methods
  ];

  return lines.join("\n");

  // ========== FUNÇÃO: Gerar método main ==========
  function generateMethod(name, params, commands, isMain) {
    const varSlots = {};
    let nextSlot = isMain ? 1 : 0; // main: slot 0 = args; funções: slot 0+ = params
    const bodyLines = [];

    function emit(line) {
      bodyLines.push(line);
    }

    function getOrCreateSlot(varName, isRef = false) {
      if (varSlots[varName] === undefined) {
        varSlots[varName] = { slot: nextSlot++, isRef };
      }
      return varSlots[varName].slot;
    }

    function getSlot(varName) {
      if (varSlots[varName] === undefined) {
        throw new Error(`codegen_jasmin: variável '${varName}' não declarada`);
      }
      return varSlots[varName];
    }

    function isRefVar(varName) {
      const v = varSlots[varName];
      return v && v.isRef;
    }

    // Registrar parâmetros
    for (const p of params) {
      getOrCreateSlot(p, false); // assume int por simplicidade
    }

    // Gerar comandos
    for (const cmd of commands) {
      genCommand(cmd);
    }

    const stackLimit = 100;
    const localsLimit = Math.max(nextSlot, 1);

    if (isMain) {
      return [
        "; método main",
        ".method public static main([Ljava/lang/String;)V",
        `  .limit stack ${stackLimit}`,
        `  .limit locals ${localsLimit}`,
        "",
        ...bodyLines,
        "",
        "  return",
        ".end method",
        ""
      ].join("\n");
    } else {
      // Função do usuário - assinatura com N ints retornando int
      const sig = "(" + "I".repeat(params.length) + ")I";
      return [
        `; função ${name}`,
        `.method public static ${name}${sig}`,
        `  .limit stack ${stackLimit}`,
        `  .limit locals ${localsLimit}`,
        "",
        ...bodyLines,
        "",
        "  iconst_0",  // retorno padrão se não houver return
        "  ireturn",
        ".end method",
        ""
      ].join("\n");
    }

    // ========== GERAR COMANDO ==========
    function genCommand(cmd) {
      if (!cmd) return;

      switch (cmd.type) {
        case "varDecl":
        case "constDecl": {
          const isArray = cmd.value && cmd.value.type === "arrayLiteral";
          const isString = cmd.value && cmd.value.type === "string";
          const isObject = cmd.value && cmd.value.type === "objectLiteral";
          const isNull = cmd.value && (cmd.value.type === "null" || cmd.value.type === "undefined");
          const isRef = isArray || isString || isObject || isNull;
          const slot = getOrCreateSlot(cmd.name, isRef);

          if (isArray) {
            genArrayLiteral(cmd.value);
            emit(`  astore ${slot}`);
          } else if (isString) {
            genStringExpr(cmd.value);
            emit(`  astore ${slot}`);
          } else if (isObject) {
            genObjectLiteral(cmd.value);
            emit(`  astore ${slot}`);
          } else if (isNull) {
            emit("  aconst_null");
            emit(`  astore ${slot}`);
          } else {
            genExpr(cmd.value);
            emit(`  istore ${slot}`);
          }
          break;
        }

        case "assignment": {
          const slotInfo = getSlot(cmd.name);
          const isRef = slotInfo.isRef;
          const slot = slotInfo.slot;

          if (isRef) {
            // Verificar tipo do valor
            if (cmd.value.type === "arrayLiteral") {
              genArrayLiteral(cmd.value);
            } else if (cmd.value.type === "string") {
              genStringExpr(cmd.value);
            } else if (cmd.value.type === "objectLiteral") {
              genObjectLiteral(cmd.value);
            } else {
              genExpr(cmd.value); // pode ser referência de outra var
            }
            emit(`  astore ${slot}`);
          } else {
            genExpr(cmd.value);
            emit(`  istore ${slot}`);
          }
          break;
        }

        case "if": {
          const labelElse = newLabel("ELSE");
          const labelEnd = newLabel("ENDIF");

          genCondition(cmd.condition, labelElse);
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
          const labelStart = newLabel("FOR");
          const labelEnd = newLabel("ENDFOR");

          if (cmd.init) genCommand(cmd.init);
          emit(`${labelStart}:`);
          genCondition(cmd.condition, labelEnd);
          cmd.body.forEach(genCommand);
          if (cmd.next) {
            if (cmd.next.type === "assignment") {
              genCommand(cmd.next);
            } else {
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
              const arg = cmd.args[0];
              // Detectar tipo do argumento
              if (arg.type === "string") {
                genStringExpr(arg);
                emit("  invokevirtual java/io/PrintStream/println(Ljava/lang/String;)V");
              } else if (arg.type === "identifier" && isRefVar(arg.value)) {
                // Pode ser string, array ou objeto - usar toString
                const slotInfo = getSlot(arg.value);
                emit(`  aload ${slotInfo.slot}`);
                emit("  invokevirtual java/lang/Object/toString()Ljava/lang/String;");
                emit("  invokevirtual java/io/PrintStream/println(Ljava/lang/String;)V");
              } else if (arg.type === "arrayAccess") {
                genArrayAccess(arg);
                emit("  invokevirtual java/io/PrintStream/println(I)V");
              } else {
                genExpr(arg);
                emit("  invokevirtual java/io/PrintStream/println(I)V");
              }
            } else {
              emit("  ldc \"\"");
              emit("  invokevirtual java/io/PrintStream/println(Ljava/lang/String;)V");
            }
          }
          break;
        }

        case "functionCall": {
          const func = userFunctions[cmd.name];
          if (func) {
            // Empilhar argumentos
            for (const arg of cmd.args) {
              genExpr(arg);
            }
            const sig = "(" + "I".repeat(func.paramCount) + ")I";
            emit(`  invokestatic ${className}/${cmd.name}${sig}`);
            emit("  pop"); // descarta retorno se usado como comando
          }
          break;
        }

        case "returnStmt": {
          if (cmd.value) {
            genExpr(cmd.value);
            emit("  ireturn");
          } else {
            if (isMain) {
              emit("  return");
            } else {
              emit("  iconst_0");
              emit("  ireturn");
            }
          }
          break;
        }

        case "userFunction":
          // Já processado separadamente
          break;

        default:
          break;
      }
    }

    // ========== GERAR EXPRESSÃO (resultado int na pilha) ==========
    function genExpr(expr) {
      if (!expr) {
        emit("  iconst_0");
        return;
      }

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
          // Null/undefined não podem ser usados como int - retorna 0
          emit("  iconst_0");
          break;

        case "identifier": {
          const slotInfo = getSlot(expr.value);
          if (slotInfo.isRef) {
            emit(`  aload ${slotInfo.slot}`);
          } else {
            emit(`  iload ${slotInfo.slot}`);
          }
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
            case "&&":
              emit("  iand");
              break;
            case "||":
              emit("  ior");
              break;
            default:
              throw new Error(`codegen_jasmin: operador não suportado: ${expr.operator}`);
          }
          break;
        }

        case "unaryOperation": {
          if (expr.operator === "!") {
            genExpr(expr.operand);
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

        case "functionCall": {
          const func = userFunctions[expr.name];
          if (func) {
            for (const arg of expr.args) {
              genExpr(arg);
            }
            const sig = "(" + "I".repeat(func.paramCount) + ")I";
            emit(`  invokestatic ${className}/${expr.name}${sig}`);
          } else {
            emit("  iconst_0");
          }
          break;
        }

        case "nativeCall": {
          if (expr.name === "parseInt" || expr.name === "parseFloat") {
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

        case "arrayAccess": {
          genArrayAccess(expr);
          break;
        }

        case "string": {
          // String em contexto de expressão int -> retorna length
          genStringExpr(expr);
          emit("  invokevirtual java/lang/String/length()I");
          break;
        }

        case "arrayLiteral": {
          // Array em contexto de expressão int -> retorna length
          genArrayLiteral(expr);
          emit("  arraylength");
          break;
        }

        case "objectLiteral": {
          // Objeto em contexto int -> retorna 0
          emit("  iconst_0");
          break;
        }

        case "assignment": {
          const slotInfo = getSlot(expr.name);
          genExpr(expr.value);
          emit("  dup");
          emit(`  istore ${slotInfo.slot}`);
          break;
        }

        default:
          emit("  iconst_0");
          break;
      }
    }

    // ========== GERAR STRING ==========
    function genStringExpr(expr) {
      if (expr.type === "string") {
        // Remove aspas do valor
        let str = expr.value;
        if ((str.startsWith('"') && str.endsWith('"')) || 
            (str.startsWith("'") && str.endsWith("'"))) {
          str = str.slice(1, -1);
        }
        // Escape para Jasmin
        str = str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        emit(`  ldc "${str}"`);
      } else if (expr.type === "identifier") {
        const slotInfo = getSlot(expr.value);
        emit(`  aload ${slotInfo.slot}`);
      } else {
        emit('  ldc ""');
      }
    }

    // ========== GERAR ARRAY LITERAL ==========
    function genArrayLiteral(expr) {
      const size = expr.elements.length;
      // Criar array de int
      emit(`  bipush ${size}`);
      emit("  newarray int");
      // Preencher elementos
      for (let i = 0; i < size; i++) {
        emit("  dup"); // duplica referência do array
        emit(`  bipush ${i}`);
        genExpr(expr.elements[i]);
        emit("  iastore");
      }
    }

    // ========== GERAR ACESSO A ARRAY ==========
    function genArrayAccess(expr) {
      // expr.array = nome do array, expr.index = expressão do índice
      const slotInfo = getSlot(expr.array);
      emit(`  aload ${slotInfo.slot}`);
      genExpr(expr.index);
      emit("  iaload");
    }

    // ========== GERAR OBJETO LITERAL ==========
    function genObjectLiteral(expr) {
      // Usar HashMap para objetos
      emit("  new java/util/HashMap");
      emit("  dup");
      emit("  invokespecial java/util/HashMap/<init>()V");
      // Adicionar campos
      for (const field of expr.fields) {
        emit("  dup"); // duplica referência do HashMap
        emit(`  ldc "${field.name}"`);
        // Valor - verificar tipo
        if (field.value.type === "string") {
          let str = field.value.value;
          if ((str.startsWith('"') && str.endsWith('"')) || 
              (str.startsWith("'") && str.endsWith("'"))) {
            str = str.slice(1, -1);
          }
          emit(`  ldc "${str}"`);
        } else if (field.value.type === "number") {
          genExpr(field.value);
          emit("  invokestatic java/lang/Integer/valueOf(I)Ljava/lang/Integer;");
        } else if (field.value.type === "boolean") {
          emit(field.value.value ? "  iconst_1" : "  iconst_0");
          emit("  invokestatic java/lang/Integer/valueOf(I)Ljava/lang/Integer;");
        } else {
          genExpr(field.value);
          emit("  invokestatic java/lang/Integer/valueOf(I)Ljava/lang/Integer;");
        }
        emit("  invokevirtual java/util/HashMap/put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;");
        emit("  pop"); // descarta retorno do put
      }
    }

    // ========== GERAR CONDIÇÃO ==========
    function genCondition(cond, labelFalse) {
      if (cond.type === "operation") {
        const op = cond.operator;
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
      genExpr(cond);
      emit(`  ifeq ${labelFalse}`);
    }
  }

  // ========== FUNÇÃO: Gerar função do usuário ==========
  function generateFunction(name, params, body) {
    return generateMethod(name, params, body, false);
  }
}

module.exports = { generateJasminProgram };
