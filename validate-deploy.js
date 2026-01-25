// Script de validação pré-deploy
require('dotenv').config();

console.log('🔍 Validando configurações para deploy...\n');

let errors = [];
let warnings = [];

// Verificar variáveis de ambiente críticas
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'LICENSE_ENCRYPTION_KEY'
];

const optionalEnvVars = [
    'NODE_ENV',
    'PORT',
    'ALLOWED_ORIGINS',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS'
];

console.log('📋 Verificando variáveis de ambiente obrigatórias:');
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.log(`   ❌ ${varName} - NÃO CONFIGURADA`);
        errors.push(`${varName} não está configurada`);
    } else if (process.env[varName].includes('mude_isso') || 
               process.env[varName].includes('sua_chave') ||
               process.env[varName].length < 20) {
        console.log(`   ⚠️  ${varName} - VALOR PADRÃO/INSEGURO`);
        warnings.push(`${varName} precisa ser alterada para um valor seguro`);
    } else {
        console.log(`   ✅ ${varName} - OK`);
    }
});

console.log('\n📋 Verificando variáveis de ambiente opcionais:');
optionalEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.log(`   ⚠️  ${varName} - não configurada`);
    } else {
        console.log(`   ✅ ${varName} - OK`);
    }
});

// Verificar dependências
console.log('\n📦 Verificando dependências:');
try {
    const packageJson = require('./package.json');
    const deps = Object.keys(packageJson.dependencies || {});
    console.log(`   ✅ ${deps.length} dependências encontradas`);
    
    // Verificar se as principais estão presentes
    const criticalDeps = ['express', 'mongoose', 'jsonwebtoken', 'bcryptjs', 'dotenv'];
    criticalDeps.forEach(dep => {
        if (!packageJson.dependencies[dep]) {
            errors.push(`Dependência crítica ${dep} não encontrada`);
        }
    });
} catch (error) {
    errors.push('Erro ao ler package.json');
}

// Verificar estrutura de arquivos
console.log('\n📁 Verificando estrutura de arquivos:');
const fs = require('fs');
const path = require('path');

const criticalFiles = [
    'server/server.js',
    'server/config/database.js',
    'public/index.html',
    'package.json'
];

criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file} - existe`);
    } else {
        console.log(`   ❌ ${file} - NÃO ENCONTRADO`);
        errors.push(`Arquivo ${file} não encontrado`);
    }
});

// Verificar arquivos de deploy
console.log('\n🚀 Verificando arquivos de deploy:');
const deployFiles = [
    'Procfile',
    'Dockerfile',
    'render.yaml',
    'railway.json',
    'vercel.json'
];

deployFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`   ✅ ${file} - presente`);
    } else {
        console.log(`   ⚠️  ${file} - não encontrado`);
    }
});

// Validar MongoDB URI
if (process.env.MONGODB_URI) {
    console.log('\n🗄️  Validando MongoDB URI:');
    const uri = process.env.MONGODB_URI;
    
    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
        warnings.push('MongoDB URI aponta para localhost - não funcionará em produção');
        console.log('   ⚠️  URI aponta para localhost (não funcionará em produção)');
    } else if (uri.includes('mongodb+srv://')) {
        console.log('   ✅ URI do MongoDB Atlas detectada');
    } else if (uri.includes('mongodb://')) {
        console.log('   ✅ URI do MongoDB detectada');
    } else {
        errors.push('MongoDB URI em formato inválido');
    }
}

// Verificar NODE_ENV
if (process.env.NODE_ENV === 'production') {
    console.log('\n⚙️  Modo: PRODUÇÃO');
} else {
    console.log('\n⚙️  Modo: DESENVOLVIMENTO');
    warnings.push('NODE_ENV não está configurado como "production"');
}

// Resumo final
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMO DA VALIDAÇÃO\n');

if (errors.length === 0 && warnings.length === 0) {
    console.log('🎉 TUDO OK! Seu projeto está pronto para deploy!');
    console.log('\n✨ Próximos passos:');
    console.log('   1. Commit e push para o GitHub');
    console.log('   2. Configure o deploy na plataforma escolhida');
    console.log('   3. Configure as variáveis de ambiente');
    console.log('   4. Faça o deploy!');
    console.log('\n📖 Consulte DEPLOY_GUIDE.md para instruções detalhadas');
    process.exit(0);
} else {
    if (errors.length > 0) {
        console.log('❌ ERROS CRÍTICOS:');
        errors.forEach((error, i) => {
            console.log(`   ${i + 1}. ${error}`);
        });
    }
    
    if (warnings.length > 0) {
        console.log('\n⚠️  AVISOS:');
        warnings.forEach((warning, i) => {
            console.log(`   ${i + 1}. ${warning}`);
        });
    }
    
    console.log('\n💡 Corrija os erros acima antes de fazer o deploy.');
    
    if (errors.length > 0) {
        process.exit(1);
    } else {
        console.log('\n⚠️  Você pode prosseguir, mas corrija os avisos para um deploy seguro.');
        process.exit(0);
    }
}
