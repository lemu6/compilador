# mini-JavaScript

**Compilador completo para linguagem JavaScript simplificada** – Trabalho final de Compiladores.

## Descrição

Este projeto implementa um compilador **completo** para uma linguagem inspirada em JavaScript, com:

- **Front-end:** análise léxica, sintática e semântica
- **Back-end JS:** geração de código JavaScript executável
- **Back-end Jasmin:** geração de bytecode JVM (arquivo `.j` para montagem com Jasmin)

---

## Pipeline de Compilação

```
┌─────────────┐    ┌──────────┐    ┌───────────┐    ┌────────────────┐
│ Código-fonte│───▶│  Scanner │───▶│  Parser   │───▶│   Semantic     │
│   (.txt)    │    │ (tokens) │    │   (AST)   │    │  (validação)   │
└─────────────┘    └──────────┘    └───────────┘    └───────┬────────┘
                                                           │
                              ┌─────────────────────────────┼─────────────────────────────┐
                              │                             │                             │
                              ▼                             ▼                             │
                    ┌─────────────────┐           ┌─────────────────┐                     │
                    │   codegen.js    │           │ codegen_jasmin  │                     │
                    │  (Back-end JS)  │           │ (Back-end JVM)  │                     │
                    └────────┬────────┘           └────────┬────────┘                     │
                             │                             │                             │
                             ▼                             ▼                             │
                    ┌─────────────────┐           ┌─────────────────┐                     │
                    │   out/out.js    │           │   out/out.j     │                     │
                    │  (executável)   │           │ (bytecode JVM)  │                     │
                    └─────────────────┘           └─────────────────┘
```

---

## Estrutura do Projeto

```
compilador/
├── index.js            # Orquestrador do pipeline
├── scanner.js          # Analisador léxico (tokenização)
├── parser.js           # Analisador sintático (gera AST)
├── semantic.js         # Analisador semântico (validação de tipos/escopo)
├── codegen.js          # Back-end: gera JavaScript
├── codegen_jasmin.js   # Back-end: gera Jasmin (JVM bytecode)
├── out/
│   ├── out.js          # Código JavaScript gerado
│   └── out.j           # Código Jasmin gerado
├── testes/             # Programas de teste
│   ├── teste_variaveis.txt
│   ├── teste_aritmetica.txt
│   ├── teste_if.txt
│   ├── teste_while.txt
│   ├── teste_for.txt
│   ├── teste_booleanos.txt
│   ├── teste_funcao.txt
│   ├── teste_array.txt
│   └── teste_objeto.txt
├── codigo_exemplo*.txt # Exemplos de código
└── README.md
```

---

## Pré-requisitos

| Ferramenta | Uso | Instalação |
|------------|-----|------------|
| **Node.js** | Executar o compilador e código JS gerado | [nodejs.org](https://nodejs.org/) |
| **Java JDK** | Executar código Jasmin compilado | [adoptium.net](https://adoptium.net/) |
| **Jasmin** | Montar `.j` → `.class` | [jasmin.sourceforge.net](http://jasmin.sourceforge.net/) |

---

## Como Usar

### 1. Compilar um programa

```bash
node index.js <arquivo.txt>
```

**Exemplo:**
```bash
node index.js codigo_teste_completo.txt
```

**Saída:**
```
Compilando: codigo_teste_completo.txt

Programa aceito.
Programa semanticamente válido!

Código JS gerado em out/out.js
Código Jasmin gerado em out/out.j
```

### 2. Executar o código JavaScript gerado

```bash
node out/out.js
```

### 3. Montar e executar o código Jasmin (JVM)

```bash
# Montar o arquivo .j para .class
java -jar jasmin.jar out/out.j

# Executar a classe gerada
java Main
```

---

## Funcionalidades Suportadas

### Back-end JavaScript (completo)

| Construção | Exemplo | Status |
|------------|---------|--------|
| Variáveis | `let x = 10;` | ✅ |
| Constantes | `const PI = 3.14;` | ✅ |
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

### Back-end Jasmin (subset numérico)

| Construção | Status | Observação |
|------------|--------|------------|
| Variáveis/constantes numéricas | ✅ | Mapeadas para `int` |
| Operações aritméticas | ✅ | `iadd`, `isub`, `imul`, `idiv`, `irem` |
| Comparações | ✅ | `if_icmp*` |
| if/else | ✅ | Labels e saltos |
| while | ✅ | Labels e saltos |
| for | ✅ | Labels e saltos |
| print | ✅ | `System.out.println(int)` |
| Booleanos | ✅ | `true`=1, `false`=0 |
| Funções de usuário | ⚠️ | Não suportado |
| Arrays/objetos | ⚠️ | Não suportado |
| Strings | ⚠️ | Não suportado |

---

## Exemplos

### Programa válido

```javascript
// Soma de 1 a 10
let soma = 0;
for (let i = 1; i <= 10; i = i + 1) {
    soma = soma + i;
}
print(soma);
```

**Saída (JS e Jasmin):** `55`

### Programa com erro semântico

```javascript
x = 5;  // Erro: variável não declarada

const idade = 10;
idade = 15;  // Erro: não pode reatribuir constante
```

**Saída:**
```
Erro semântico: variável 'x' não declarada na linha 1
```

---

## Testes

Executar todos os testes:

```bash
# Testes individuais
node index.js testes/teste_variaveis.txt && node out/out.js
node index.js testes/teste_aritmetica.txt && node out/out.js
node index.js testes/teste_if.txt && node out/out.js
node index.js testes/teste_while.txt && node out/out.js
node index.js testes/teste_for.txt && node out/out.js
node index.js testes/teste_booleanos.txt && node out/out.js
node index.js testes/teste_funcao.txt && node out/out.js  # Só JS
node index.js testes/teste_array.txt && node out/out.js   # Só JS
```

---

## Autoria

**Lemuel Cavalcante** – 20209063994  
**Matheus Henrique** – 20199042831

Disciplina: **Compiladores – UFPI – 2025.2**
