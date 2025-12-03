# Compilador mini-JavaScript

**Trabalho Final – Compiladores – UFPI 2025.2**

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

# Ubuntu
sudo apt install nodejs npm default-jdk
```

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
| Tipo | Exemplo | Arquivo |
|------|---------|---------|
| Léxico | `let x = @10;` | `exemplos/erro_lexico.txt` |
| Sintático | `let x = ;` | `exemplos/erro_sintatico.txt` |
| Semântico | `x = 10;` (não declarada) | `exemplos/erro_var_nao_declarada.txt` |
| Semântico | `const PI=3; PI=4;` | `exemplos/erro_const.txt` |
| Semântico | `let x=1; let x=2;` | `exemplos/erro_redeclaracao.txt` |

### Erros de Back-end (Runtime JVM)
| Tipo | Exemplo | Arquivo |
|------|---------|---------|
| `ArithmeticException` | `10 / 0` | `testes/erro_divisao_zero.txt` |
| `ArrayIndexOutOfBounds` | `arr[-1]` | `testes/erro_indice_negativo.txt` |
| `ArrayIndexOutOfBounds` | `arr[100]` | `testes/erro_indice_fora.txt` |

## Funcionalidades

| Feature | JS | Jasmin |
|---------|:--:|:------:|
| Variáveis/Constantes | ✅ | ✅ |
| Aritmética (+,-,*,/,%) | ✅ | ✅ |
| Comparações | ✅ | ✅ |
| Lógicos (&&, \|\|, !) | ✅ | ✅ |
| if/else, while, for | ✅ | ✅ |
| Funções de usuário | ✅ | ✅ |
| Arrays | ✅ | ✅ |
| Strings | ✅ | ✅ |
| Objetos | ✅ | ✅ |
| print() | ✅ | ✅ |

## Testes

```bash
# Testes de funcionalidade
node index.js testes/teste_variaveis.txt && node out/out.js
node index.js testes/teste_funcao_jasmin.txt && java -jar jasmin.jar out/out.j && java Main
node index.js testes/teste_array_jasmin.txt && java -jar jasmin.jar out/out.j && java Main
```

## Autoria

**Lemuel Cavalcante** – 20209063994  
**Matheus Henrique** – 20199042831

Disciplina: **Compiladores – UFPI – 2025.2**
