// Script para criar usuário administrador
require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('./server/models/Usuario');
const Licenca = require('./server/models/Licenca');

const MONGODB_URI = process.env.MONGODB_URI;

async function criarAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');

        const email = 'wanderpsc@gmail.com';
        const senha = 'Wpsc2026@';
        const nome = 'Administrador';
        const instituicao = 'Sistema';

        // Verificar se usuário já existe
        let usuario = await Usuario.findOne({ email });
        
        if (usuario) {
            console.log('⚠️  Usuário já existe. Deletando para recriar...');
            await Usuario.deleteOne({ email });
            await Licenca.deleteMany({ usuario: usuario._id });
        }

        console.log('➕ Criando novo usuário admin...');
        
        // Criar usuário - Mongoose faz o hash automaticamente
        usuario = await Usuario.create({
            nome,
            email,
            senha, // Mongoose vai fazer o hash no middleware pre('save')
            instituicao,
            telefone: '',
            role: 'admin',
            ativo: true,
            aceitouTermos: true,
            dataAceiteTermos: new Date()
        });

        console.log('✅ Usuário admin criado!');

        // Criar licença trial
        const chaveLicenca = Licenca.gerarChaveLicenca();
        const licenca = await Licenca.create({
            usuario: usuario._id,
            tipo: 'trial',
            chaveLicenca: chaveLicenca,
            dataInicio: new Date(),
            dataExpiracao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
            limiteCertificados: 10,
            certificadosGerados: 0,
            status: 'ativa',
            recursos: {
                multiplosTemplates: false,
                templatesCustomizados: false,
                exportacaoPDF: true,
                historicosEscolares: false,
                marcaDagua: true
            },
            metodoPagamento: 'cortesia'
        });

        await licenca.save();
        console.log('✅ Licença trial criada!');

        console.log('\n📋 CREDENCIAIS DE ACESSO:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Senha: ${senha}`);
        console.log(`👑 Role: admin`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🔗 Acesse: http://localhost:5000/login.html');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

criarAdmin();
