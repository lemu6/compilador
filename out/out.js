let numeros = [10, 20, 30, 40, 50];
console.log(numeros[0]);
console.log(numeros[2]);
console.log(numeros[4]);
let soma = 0;
for (let i = 0; (i < 5); i = (i + 1)) {
  soma = (soma + numeros[i]);
}
console.log(soma);