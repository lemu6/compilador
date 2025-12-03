# Compilador mini-JavaScript

**Compilador completo para linguagem JavaScript simplificada**  
Trabalho Final – Disciplina de Compiladores – UFPI 2025.2

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Compilador](#arquitetura-do-compilador)
3. [Instalação e Pré-requisitos](#instalação-e-pré-requisitos)
4. [Como Usar](#como-usar)
5. [Regras de Tradução (AST → Jasmin)](#regras-de-tradução-ast--jasmin)
6. [Geração de Executável](#geração-de-executável)
7. [Exemplos de Execução](#exemplos-de-execução)
8. [Funcionalidades Suportadas](#funcionalidades-suportadas)
9. [Autoria](#autoria)

---

## Visão Geral

Este projeto implementa um compilador completo para uma linguagem baseada em JavaScript simplificado, com:

- **Front-end:** análise léxica, sintática e semântica
- **Back-end JavaScript:** geração de código JavaScript executável
- **Back-end Jasmin:** geração de código intermediário Jasmin (bytecode JVM)

---

## Arquitetura do Compilador

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
│  │  (codegen.js)    │          │(codegen_jasmin.js│                 │
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

### Arquivos do Projeto

| Arquivo | Descrição |
|---------|-----------|
| `scanner.js` | Análise léxica – tokenização do código fonte |
| `parser.js` | Análise sintática – geração da AST (Árvore Sintática Abstrata) |
| `semantic.js` | Análise semântica – verificação de tipos e escopo |
| `codegen.js` | Geração de código JavaScript |
| `codegen_jasmin.js` | Geração de código intermediário Jasmin (JVM) |
| `index.js` | Orquestrador do compilador |

---

## Instalação e Pré-requisitos

### Requisitos de Software

| Ferramenta | Versão Mínima | Uso | Link |
|------------|---------------|-----|------|
| **Node.js** | 14.x+ | Executar o compilador e código JS gerado | [nodejs.org](https://nodejs.org/) |
| **Java JDK** | 8+ | Executar código Jasmin compilado | [adoptium.net](https://adoptium.net/) |
| **Jasmin** | 2.4+ | Montar `.j` → `.class` | [jasmin.sf.net](http://jasmin.sourceforge.net/) |

### Instalação no macOS

```bash
# Node.js (via Homebrew)
brew install node

# Java JDK
brew install openjdk

# Jasmin (download manual)
# 1. Baixe jasmin.jar de http://jasmin.sourceforge.net/
# 2. Coloque na pasta do projeto ou em /usr/local/lib/
```

### Instalação no Ubuntu/Debian

```bash
# Node.js
sudo apt update
sudo apt install nodejs npm

# Java JDK
sudo apt install default-jdk

# Jasmin
# 1. Baixe jasmin.jar de http://jasmin.sourceforge.net/
# 2. Coloque na pasta do projeto
```

### Instalação no Windows

1. **Node.js**: Baixe e instale de [nodejs.org](https://nodejs.org/)
2. **Java JDK**: Baixe e instale de [adoptium.net](https://adoptium.net/)
3. **Jasmin**: Baixe `jasmin.jar` de [jasmin.sf.net](http://jasmin.sourceforge.net/)

### Verificar Instalação

```bash
node --version      # v14.0.0 ou superior
java -version       # java 8 ou superior
```

---

## Como Usar

### 1. Compilar um Programa

```bash
node index.js <arquivo.txt>
```

**Exemplo:**
```bash
node index.js codigo_teste_completo.txt
```

**Saída esperada:**
```
Compilando: codigo_teste_completo.txt

Programa aceito.
Programa semanticamente válido!

Código JS gerado em out/out.js
Código Jasmin gerado em out/out.j
```

### 2. Executar o Código JavaScript

```bash
node out/out.js
```

### 3. Montar e Executar o Código Jasmin (JVM)

```bash
# Montar o arquivo .j para .class
java -jar jasmin.jar out/out.j

# Executar a classe gerada
java Main
```

---

## Regras de Tradução (AST → Jasmin)

O back-end Jasmin traduz a AST (Árvore Sintática Abstrata) para instruções da JVM.

### Mapeamento de Variáveis

As variáveis locais são mapeadas para **slots** da JVM:
- Slot 0: `args` (parâmetro do main)
- Slots 1+: variáveis do programa

```
Fonte:               Jasmin:
let x = 10;    →     bipush 10
                     istore 1    ; x no slot 1
                     
let y = 20;    →     bipush 20
                     istore 2    ; y no slot 2
```

### Declarações de Variáveis (`varDecl`, `constDecl`)

| AST | Instruções Jasmin |
|-----|-------------------|
| `{ type: "varDecl", name: "x", value: {type: "number", value: 10} }` | `bipush 10`<br>`istore <slot>` |

### Atribuições (`assignment`)

| AST | Instruções Jasmin |
|-----|-------------------|
| `{ type: "assignment", name: "x", value: expr }` | `<código de expr>`<br>`istore <slot>` |

### Operações Aritméticas (`operation`)

| Operador | Instrução JVM | Descrição |
|----------|---------------|-----------|
| `+` | `iadd` | Soma inteira |
| `-` | `isub` | Subtração inteira |
| `*` | `imul` | Multiplicação inteira |
| `/` | `idiv` | Divisão inteira |
| `%` | `irem` | Resto da divisão |

**Exemplo:**
```
Fonte:               Jasmin:
let z = x + y;  →    iload 1       ; carrega x
                     iload 2       ; carrega y
                     iadd          ; soma
                     istore 3      ; armazena em z
```

### Comparações

| Operador | Instrução JVM (salto se falso) |
|----------|-------------------------------|
| `<` | `if_icmpge` |
| `<=` | `if_icmpgt` |
| `>` | `if_icmple` |
| `>=` | `if_icmplt` |
| `==` | `if_icmpne` |
| `!=` | `if_icmpeq` |

### Operadores Lógicos

| Operador | Instrução JVM |
|----------|---------------|
| `&&` | `iand` (AND bit-a-bit em 0/1) |
| `\|\|` | `ior` (OR bit-a-bit em 0/1) |
| `!` | `ifeq`/saltos para inverter |

### Estrutura `if/else`

```
Fonte:                    Jasmin:
if (x > 5) {         →    iload 1           ; carrega x
    print(1);             bipush 5          ; carrega 5
} else {                  if_icmple ELSE0   ; se x <= 5, vai para else
    print(0);             ; código do then
}                         getstatic java/lang/System/out ...
                          iconst_1
                          invokevirtual .../println(I)V
                          goto ENDIF0
                     ELSE0:
                          ; código do else
                          getstatic java/lang/System/out ...
                          iconst_0
                          invokevirtual .../println(I)V
                     ENDIF0:
```

### Estrutura `while`

```
Fonte:                    Jasmin:
while (i < 10) {     →    WHILE0:
    i = i + 1;            iload 1           ; carrega i
}                         bipush 10         ; carrega 10
                          if_icmpge ENDWHILE0 ; se i >= 10, sai
                          ; corpo do while
                          iload 1
                          iconst_1
                          iadd
                          istore 1
                          goto WHILE0       ; volta ao início
                     ENDWHILE0:
```

### Estrutura `for`

```
Fonte:                         Jasmin:
for (let i=0; i<5; i=i+1) {    bipush 0
    print(i);                  istore 1        ; init: i = 0
}                         FOR0:
                               iload 1
                               bipush 5
                               if_icmpge ENDFOR0  ; cond: i >= 5 → sai
                               ; corpo
                               getstatic ...
                               iload 1
                               invokevirtual .../println(I)V
                               ; incremento: i = i + 1
                               iload 1
                               iconst_1
                               iadd
                               istore 1
                               goto FOR0
                          ENDFOR0:
```

### Função `print`

```
Fonte:               Jasmin:
print(x);       →    getstatic java/lang/System/out Ljava/io/PrintStream;
                     iload 1                           ; valor a imprimir
                     invokevirtual java/io/PrintStream/println(I)V
```

### Funções de Usuário (`function`)

**Declaração de função:**
```
Fonte:                              Jasmin:
function dobro(x) {            →    .method public static dobro(I)I
    return x * 2;                     .limit stack 100
}                                     .limit locals 1
                                      iload 0         ; parâmetro x
                                      iconst_2
                                      imul
                                      ireturn
                                    .end method
```

**Chamada de função:**
```
Fonte:                              Jasmin:
let y = dobro(5);              →    bipush 5
                                    invokestatic Main/dobro(I)I
                                    istore 1        ; y no slot 1
```

**Assinaturas geradas:**
| Parâmetros | Assinatura JVM |
|------------|----------------|
| 1 parâmetro | `(I)I` |
| 2 parâmetros | `(II)I` |
| 3 parâmetros | `(III)I` |

### Arrays (`arrayLiteral`, `arrayAccess`)

**Criação de array:**
```
Fonte:                              Jasmin:
let arr = [10, 20, 30];        →    bipush 3        ; tamanho do array
                                    newarray int    ; cria array de int
                                    dup
                                    bipush 0        ; índice 0
                                    bipush 10       ; valor 10
                                    iastore         ; arr[0] = 10
                                    dup
                                    bipush 1        ; índice 1
                                    bipush 20       ; valor 20
                                    iastore         ; arr[1] = 20
                                    dup
                                    bipush 2        ; índice 2
                                    bipush 30       ; valor 30
                                    iastore         ; arr[2] = 30
                                    astore 1        ; arr no slot 1 (ref)
```

**Acesso a elemento:**
```
Fonte:                              Jasmin:
print(arr[1]);                 →    getstatic java/lang/System/out ...
                                    aload 1         ; carrega ref do array
                                    iconst_1        ; índice 1
                                    iaload          ; carrega arr[1]
                                    invokevirtual .../println(I)V
```

### Strings (`string`)

```
Fonte:                              Jasmin:
let msg = "Hello World";       →    ldc "Hello World"
                                    astore 1        ; msg no slot 1 (ref)

print(msg);                    →    getstatic java/lang/System/out ...
                                    aload 1         ; carrega ref da string
                                    invokevirtual java/lang/Object/toString()Ljava/lang/String;
                                    invokevirtual .../println(Ljava/lang/String;)V
```

### Constantes Numéricas

| Valor | Instrução | Descrição |
|-------|-----------|-----------|
| -1 a 5 | `iconst_*` | Constantes embutidas |
| -128 a 127 | `bipush N` | Byte push |
| -32768 a 32767 | `sipush N` | Short push |
| Outros | `ldc N` | Load constant |

---

## Geração de Executável

### Fluxo Completo

```bash
# 1. Compilar fonte → Jasmin
node index.js programa.txt

# 2. Montar Jasmin → Bytecode JVM
java -jar jasmin.jar out/out.j
# Gera: Main.class

# 3. Executar na JVM
java Main
```

### Script Automatizado

Crie um arquivo `compilar.sh`:

```bash
#!/bin/bash
if [ -z "$1" ]; then
    echo "Uso: ./compilar.sh <arquivo.txt>"
    exit 1
fi

echo "=== Compilando $1 ==="
node index.js "$1"

if [ $? -eq 0 ]; then
    echo ""
    echo "=== Executando JavaScript ==="
    node out/out.js
    
    echo ""
    echo "=== Montando Jasmin ==="
    java -jar jasmin.jar out/out.j
    
    echo ""
    echo "=== Executando na JVM ==="
    java Main
fi
```

---

## Exemplos de Execução

### Exemplo 1: Programa Válido (Soma de 1 a 10)

**Arquivo:** `exemplo_soma.txt`
```javascript
// Calcula a soma de 1 a 10
let soma = 0;
for (let i = 1; i <= 10; i = i + 1) {
    soma = soma + i;
}
print(soma);
```

**Compilação:**
```bash
$ node index.js exemplo_soma.txt
Compilando: exemplo_soma.txt

Programa aceito.
Programa semanticamente válido!

Código JS gerado em out/out.js
Código Jasmin gerado em out/out.j
```

**Execução JavaScript:**
```bash
$ node out/out.js
55
```

**Execução JVM:**
```bash
$ java -jar jasmin.jar out/out.j
Generated: Main.class

$ java Main
55
```

---

### Exemplo 2: Programa Válido (Fatorial)

**Arquivo:** `exemplo_fatorial.txt`
```javascript
// Calcula fatorial de 5
let n = 5;
let fat = 1;
while (n > 0) {
    fat = fat * n;
    n = n - 1;
}
print(fat);
```

**Execução:**
```bash
$ node index.js exemplo_fatorial.txt && node out/out.js
Compilando: exemplo_fatorial.txt

Programa aceito.
Programa semanticamente válido!

Código JS gerado em out/out.js
Código Jasmin gerado em out/out.j
120
```

---

### Exemplo 3: Programa com Erro Léxico

**Arquivo:** `erro_lexico.txt`
```javascript
let x = @10;
```

**Execução:**
```bash
$ node index.js erro_lexico.txt
Compilando: erro_lexico.txt

Erro léxico na linha 1: token inválido perto de '@10;'
```

---

### Exemplo 4: Programa com Erro Sintático

**Arquivo:** `erro_sintatico.txt`
```javascript
let x = ;
```

**Execução:**
```bash
$ node index.js erro_sintatico.txt
Compilando: erro_sintatico.txt

Erro de sintaxe na linha 1: esperado token do tipo 'NUMBER', mas encontrado ';'
```

---

### Exemplo 5: Programa com Erro Semântico (Variável não declarada)

**Arquivo:** `erro_var_nao_declarada.txt`
```javascript
x = 10;
print(x);
```

**Execução:**
```bash
$ node index.js erro_var_nao_declarada.txt
Compilando: erro_var_nao_declarada.txt

Programa aceito.
Erro semântico: variável 'x' não declarada antes do uso (linha 1)
```

---

### Exemplo 6: Programa com Erro Semântico (Reatribuição de constante)

**Arquivo:** `erro_const.txt`
```javascript
const PI = 3;
PI = 4;
```

**Execução:**
```bash
$ node index.js erro_const.txt
Compilando: erro_const.txt

Programa aceito.
Erro semântico: não é permitido reatribuir constante 'PI' (linha 2)
```

---

### Exemplo 7: Programa com Erro Semântico (Redeclaração)

**Arquivo:** `erro_redeclaracao.txt`
```javascript
let x = 10;
let x = 20;
```

**Execução:**
```bash
$ node index.js erro_redeclaracao.txt
Compilando: erro_redeclaracao.txt

Programa aceito.
Erro semântico: variável 'x' já declarada no escopo atual na linha 2
```

---

### Exemplo 8: Programa Válido (If/Else)

**Arquivo:** `exemplo_if.txt`
```javascript
let idade = 18;
if (idade >= 18) {
    print(1);
} else {
    print(0);
}
```

**Execução:**
```bash
$ node index.js exemplo_if.txt && node out/out.js
Compilando: exemplo_if.txt

Programa aceito.
Programa semanticamente válido!

Código JS gerado em out/out.js
Código Jasmin gerado em out/out.j
1
```

---

## Funcionalidades Suportadas

### Back-end JavaScript (Completo)

| Construção | Exemplo | Status |
|------------|---------|--------|
| Variáveis | `let x = 10;` | ✅ |
| Constantes | `const PI = 3;` | ✅ |
| Atribuições | `x = 20;` | ✅ |
| Operações aritméticas | `+`, `-`, `*`, `/`, `%` | ✅ |
| Comparações | `<`, `<=`, `>`, `>=`, `==`, `!=` | ✅ |
| Operadores lógicos | `&&`, `\|\|`, `!` | ✅ |
| if/else | `if (x > 5) {...} else {...}` | ✅ |
| while | `while (x < 10) {...}` | ✅ |
| for | `for (let i = 0; i < 5; i = i + 1) {...}` | ✅ |
| Funções de usuário | `function soma(a, b) { return a + b; }` | ✅ |
| Arrays | `let arr = [1, 2, 3]; arr[0];` | ✅ |
| Objetos | `let obj = {x: 1, y: 2};` | ✅ |
| Funções nativas | `print()`, `parseInt()`, `typeof()` | ✅ |

### Back-end Jasmin (Completo)

| Construção | Status | Instrução JVM |
|------------|--------|---------------|
| Variáveis/constantes numéricas | ✅ | `istore`, `iload` |
| Operações aritméticas | ✅ | `iadd`, `isub`, `imul`, `idiv`, `irem` |
| Comparações | ✅ | `if_icmp*` |
| Operadores lógicos | ✅ | `iand`, `ior`, `ifeq` |
| if/else | ✅ | Labels + saltos |
| while | ✅ | Labels + saltos |
| for | ✅ | Labels + saltos |
| print | ✅ | `invokevirtual PrintStream/println` |
| Booleanos | ✅ | `true`=1, `false`=0 |
| Funções de usuário | ✅ | `invokestatic Main/<func>(I...)I` |
| Arrays (inteiros) | ✅ | `newarray int`, `iaload`, `iastore` |
| Strings | ✅ | `ldc "..."`, `aload`, `astore` |
| Objetos | ✅ | `java/util/HashMap` |

---

## Testes Automatizados

Execute os testes individuais:

```bash
# Teste de variáveis
node index.js testes/teste_variaveis.txt && node out/out.js

# Teste de aritmética
node index.js testes/teste_aritmetica.txt && node out/out.js

# Teste de if/else
node index.js testes/teste_if.txt && node out/out.js

# Teste de while
node index.js testes/teste_while.txt && node out/out.js

# Teste de for
node index.js testes/teste_for.txt && node out/out.js

# Teste de booleanos
node index.js testes/teste_booleanos.txt && node out/out.js

# Teste de funções (JavaScript e Jasmin)
node index.js testes/teste_funcao_jasmin.txt && node out/out.js

# Teste de arrays (JavaScript e Jasmin)
node index.js testes/teste_array_jasmin.txt && node out/out.js

# Teste de strings (JavaScript e Jasmin)
node index.js testes/teste_string_jasmin.txt && node out/out.js
```

### Testes com JVM (requer jasmin.jar)

```bash
# Compilar e executar na JVM
node index.js testes/teste_funcao_jasmin.txt
java -jar jasmin.jar out/out.j
java Main
# Saída esperada: 10, 30, 14

node index.js testes/teste_array_jasmin.txt
java -jar jasmin.jar out/out.j
java Main
# Saída esperada: 10, 30, 50, 150

node index.js testes/teste_string_jasmin.txt
java -jar jasmin.jar out/out.j
java Main
# Saída esperada: Hello World, Ola Jasmin!
```

---

## Autoria

**Lemuel Cavalcante** – 20209063994  
**Matheus Henrique** – 20199042831

Disciplina: **Compiladores – UFPI – 2025.2**
