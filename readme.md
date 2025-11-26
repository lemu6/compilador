mini-Javascript

Compilador para linguagem JavaScript simplificada – Trabalho final de Compiladores.

Descrição

Este projeto implementa um compilador front-end de uma linguagem inspirada em JavaScript, conforme especificação fornecida para disciplina de Compiladores na UFPI. Inclui analisador léxico, sintático e semântico, capazes de validar e reportar erros em programas escritos nessa linguagem.​

Estrutura do Projeto

index.js: script principal, integra todas as etapas.

scanner.js: analisador léxico (tokeniza o código).

parser.js: analisador sintático (valida a estrutura do código e gera comandos para o semântico).

semantic.js: analisador semântico (valida significado, declarações, tipos, etc).

codigo_exemplo.txt: exemplos de código para teste.

README.md: este guia.

Tecnologias Utilizadas

Node.js

JavaScript puro

Como Executar

Instale o Node.js (nodejs.org).

Clone este repositório ou copie os arquivos para uma pasta local.

Adicione exemplos em codigo_exemplo.txt.

Execute no terminal:

text
node index.js

Exemplos de Uso
Código válido

let nome = "João";
const idade = 20;
if (idade > 18) {
  print("Maior de idade");
}

Código com erro semântico

x = 5; // Erro: variável não declarada
const idade = 10;
idade = 15; // Erro: não pode reatribuir constante

Funcionalidades

Validação de sintaxe: variáveis, constantes, comandos de controle, blocos.
Análise semântica: tipos, uso correto de nomes, proibição de erros conforme especificação.
Mensagens detalhadas de erro (linha e descrição).

Autoria

Feito por: Lemuel Cavalcante – 20209063994
Disciplina: Compiladores – UFPI – 2025.2
