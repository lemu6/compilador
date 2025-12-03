let idade = 25;
const nome = "Lemuel";
let ativo = true;
let lista = [1, 2, 3];
let pessoa = { nome: "Ana", idade: 30 };
let vazio = null;
let indefinido = undefined;
let total = ((5 + 3) * 2);
let comparacao = ((total > 10) && true);
let negacao = (!false);
let modulo = (10 % 3);
let contador = 0;
const PI = 3.14;
if ((contador < 10)) {
  let interno = (contador * 2);
  console.log(interno);
}
function soma(a, b) {
  return (a + b);
}
let resultado = soma(3, 7);
console.log(resultado);
console.log("Teste");
let num = parseInt("123");
console.log(typeof num);
let i = 0;
while ((i < 5)) {
  console.log(i);
  i = (i + 1);
}
for (let j = 0; (j < 3); j = (j + 1)) {
  console.log(j);
}
if ((i === 5)) {
  console.log("Fim da contagem");
} else {
  console.log("Contagem incompleta");
}
let misto = [1, "texto", true];
console.log(lista[0]);
console.log(lista[2]);