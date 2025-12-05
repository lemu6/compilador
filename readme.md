# Compilador mini-JavaScript

**Trabalho Final – Compiladores – UFPI 2025.2**

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Instalação](#instalação)
4. [Como Usar](#como-usar)
5. [Regras de Tradução (AST → Jasmin)](#regras-de-tradução-ast--jasmin)
6. [Exemplos](#exemplos)
7. [Funcionalidades](#funcionalidades)
8. [Testes](#testes)
9. [Autoria](#autoria)

---

## Visão Geral

Compilador para JavaScript simplificado com:
- **Front-end:** análise léxica, sintática e semântica
- **Back-end JS:** gera código JavaScript executável
- **Back-end Jasmin:** gera bytecode JVM

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONT-END                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Código Fonte (.txt)                                                │
│        ↓                                                            │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐            │
│  │  Scanner    │ →   │   Parser    │ →   │  Semântico  │            │
│  │ (Léxico)    │     │ (Sintático) │     │  (Tipos)    │            │
│  └─────────────┘     └─────────────┘     └─────────────┘            │
│        ↓                   ↓                   ↓                    │
│    [Tokens]            [AST]            [AST Validada]              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         BACK-END                                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐          ┌──────────────────┐                 │
│  │   CodeGen JS     │          │  CodeGen Jasmin  │                 │
│  │  (codegen.js)    │          │(codegen_jasmin.js)                 │
│  └────────┬─────────┘          └────────┬─────────┘                 │
│           ↓                             ↓                           │
│     out/out.js                    out/out.j                         │
│    (JavaScript)               (Código Jasmin)                       │
│           ↓                             ↓                           │
│     node out.js                 jasmin out.j                        │
│    (Execução JS)                        ↓                           │
│                                   Main.class                        │
│                                         ↓                           │
│                                   java Main                         │
│                                 (Execução JVM)                      │
└─────────────────────────────────────────────────────────────────────┘
```

| Arquivo | Função |
|---------|--------|
| `scanner.js` | Análise léxica |
| `parser.js` | Análise sintática (AST) |
| `semantic.js` | Verificação de tipos/escopo |
| `codegen.js` | Geração de código JS |
| `codegen_jasmin.js` | Geração de código Jasmin |

## Instalação

**Requisitos:** Node.js 14+, Java JDK 8+, jasmin.jar

```bash
# macOS
brew install node openjdk

# Ubuntu/Debian
sudo apt install nodejs npm default-jdk

# Windows
# 1. Node.js: baixe de https://nodejs.org/
# 2. Java JDK: baixe de https://adoptium.net/
# 3. jasmin.jar: baixe de http://jasmin.sourceforge.net/
```

**Links:**
- [Node.js](https://nodejs.org/)
- [Java JDK (Adoptium)](https://adoptium.net/)
- [Jasmin](http://jasmin.sourceforge.net/)

## Como Usar

```bash
# Compilar
node index.js <arquivo.txt>

# Executar JS
node out/out.js

# Executar JVM (comando único)
node index.js <arquivo.txt> && java -jar jasmin.jar out/out.j && java Main
```

## Regras de Tradução (AST → Jasmin)

### Variáveis e Operações
| Fonte | Jasmin |
|-------|--------|
| `let x = 10;` | `bipush 10` → `istore 1` |
| `x + y` | `iload 1` → `iload 2` → `iadd` |
| `x - y` | `isub` |
| `x * y` | `imul` |
| `x / y` | `idiv` |
| `x % y` | `irem` |

### Comparações e Lógicos
| Operador | Instrução JVM |
|----------|---------------|
| `<, <=, >, >=, ==, !=` | `if_icmp*` + labels |
| `&&` | `iand` |
| `\|\|` | `ior` |
| `!` | `ifeq` + saltos |

### Estruturas de Controle
| Fonte | Jasmin |
|-------|--------|
| `if/else` | `if_icmp*` → ELSE → ENDIF labels |
| `while` | WHILE: → condição → `goto WHILE` → ENDWHILE |
| `for` | init → FOR: → condição → corpo → inc → `goto FOR` |

### Funções
```
function dobro(x) { return x*2; }  →  .method public static dobro(I)I
let y = dobro(5);                  →  bipush 5 → invokestatic Main/dobro(I)I
```

### Arrays e Strings
| Fonte | Jasmin |
|-------|--------|
| `let arr = [1,2,3];` | `newarray int` + `iastore` |
| `arr[i]` | `aload` + `iaload` |
| `let s = "Hello";` | `ldc "Hello"` + `astore` |

### Print
```
print(x);  →  getstatic System/out → iload → invokevirtual println(I)V
```

## Exemplos

### Sucesso
```bash
# Soma 1 a 10
node index.js exemplos/exemplo_soma.txt && java -jar jasmin.jar out/out.j && java Main
# Saída: 55

# Fatorial
node index.js exemplos/exemplo_fatorial.txt && java -jar jasmin.jar out/out.j && java Main
# Saída: 120
```

### Erros de Front-end (Compilação)

```bash
# Erro Léxico - caractere inválido '@'
node index.js exemplos/erro_lexico.txt
# Saída: Erro léxico na linha 1: token inválido perto de '@10;'

# Erro Sintático - falta expressão após '='
node index.js exemplos/erro_sintatico.txt
# Saída: Erro de sintaxe na linha 1: esperado expressão, mas encontrado ';'

# Erro Semântico - variável não declarada
node index.js exemplos/erro_var_nao_declarada.txt
# Saída: Erro semântico: variável 'x' não declarada antes do uso (linha 1)

# Erro Semântico - reatribuição de constante
node index.js exemplos/erro_const.txt
# Saída: Erro semântico: não é permitido reatribuir constante 'PI' (linha 2)

# Erro Semântico - redeclaração de variável
node index.js exemplos/erro_redeclaracao.txt
# Saída: Erro semântico: variável 'x' já declarada no escopo atual na linha 2
```

### Erros de Back-end (Runtime JVM)

```bash
# Divisão por zero
node index.js testes/erro_divisao_zero.txt && java -jar jasmin.jar out/out.j && java Main
# Saída: Exception in thread "main" java.lang.ArithmeticException: / by zero

# Índice negativo (i = 0 - 1)
node index.js testes/erro_indice_negativo.txt && java -jar jasmin.jar out/out.j && java Main
# Saída: Exception in thread "main" java.lang.ArrayIndexOutOfBoundsException: -1

# Índice fora dos limites
node index.js testes/erro_indice_fora.txt && java -jar jasmin.jar out/out.j && java Main
# Saída: Exception in thread "main" java.lang.ArrayIndexOutOfBoundsException: 100
```


## Testes

```bash
# macOS/Linux
node index.js testes/teste_variaveis.txt && node out/out.js
node index.js testes/teste_funcao_jasmin.txt && java -jar jasmin.jar out/out.j && java Main
node index.js testes/teste_array_jasmin.txt && java -jar jasmin.jar out/out.j && java Main
```

```powershell
# Windows (PowerShell)
node index.js testes/teste_variaveis.txt; node out/out.js
node index.js testes/teste_funcao_jasmin.txt; java -jar jasmin.jar out/out.j; java Main
node index.js testes/teste_array_jasmin.txt; java -jar jasmin.jar out/out.j; java Main
```

## Conformidade com a Especificação

O compilador segue a especificação da linguagem simplificada baseada em JavaScript, incluindo:

- ✅ Todos os tipos de dados: `number`, `string`, `boolean`, `null`, `undefined`, `array`, `object`
- ✅ Declaração de variáveis com `let` e constantes com `const`
- ✅ Verificação de reatribuição de constantes
- ✅ Escopo de bloco para variáveis
- ✅ Declaração de funções com `function`, parâmetros e `return`
- ✅ Estruturas de controle: `if/else`, `while`, `for`
- ✅ Operadores aritméticos, de comparação, igualdade e lógicos
- ✅ Precedência correta de operadores
- ✅ Funções nativas: `print()`, `parseInt()`, `parseFloat()`, `typeof()`
- ✅ Variáveis devem ser declaradas antes do uso

### Extensões Implementadas

Além da especificação, o compilador inclui algumas extensões úteis:

| Extensão | Descrição |
|----------|-----------|
| `console()` | Sinônimo de `print()` para compatibilidade |
| `prompt()` | Leitura de entrada do usuário |
| Comentários `//` | Comentários de linha única |
| Hoisting de funções | Funções podem ser chamadas antes de serem declaradas |

## Autoria

**Lemuel Cavalcante** – 20209063994  
**Matheus Henrique** – 20199042831

Disciplina: **Compiladores – UFPI – 2025.2**
