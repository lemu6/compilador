function soma(a, b) {
  return (a + b);
}
let resultado = soma(3, 7);
console.log(resultado);
function fatorial(n) {
  if ((n <= 1)) {
    return 1;
  }
  return (n * fatorial((n - 1)));
}
console.log(fatorial(5));