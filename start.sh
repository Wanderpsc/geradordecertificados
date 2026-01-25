#!/bin/bash

echo "🚀 Iniciando aplicação..."
echo "📊 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# Verificar variáveis de ambiente críticas
if [ -z "$MONGODB_URI" ]; then
    echo "❌ ERRO: MONGODB_URI não configurada!"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERRO: JWT_SECRET não configurada!"
    exit 1
fi

echo "✅ Variáveis de ambiente configuradas"
echo "🌐 Iniciando servidor..."

# Iniciar aplicação
npm start
