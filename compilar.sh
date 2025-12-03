#!/bin/bash
# Script para compilar e executar programas mini-JavaScript

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
    
    if [ -f "jasmin.jar" ]; then
        echo ""
        echo "=== Montando Jasmin ==="
        java -jar jasmin.jar out/out.j
        
        echo ""
        echo "=== Executando na JVM ==="
        java Main
    else
        echo ""
        echo "(jasmin.jar não encontrado - pulando execução JVM)"
    fi
fi
