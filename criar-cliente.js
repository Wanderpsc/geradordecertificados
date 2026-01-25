require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('./server/models/Usuario');
const Licenca = require('./server/models/Licenca');

async function criarCliente() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Conectado ao MongoDB');

        // Verificar se já existe
        const usuarioExistente = await Usuario.findOne({ email: 'cliente@teste.com' });
        if (usuarioExistente) {
            console.log('❌ Cliente já existe!');
            process.exit(0);
        }

        // Criar licença trial
        const licenca = await Licenca.create({
            tipo: 'trial',
            chaveLicenca: 'TRIAL-' + Date.now(),
            dataInicio: new Date(),
            dataExpiracao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
            certificadosRestantes: 10,
            ativo: true
        });

        // Criar cliente
        const cliente = await Usuario.create({
            nome: 'Cliente Teste',
            email: 'cliente@teste.com',
            senha: '123456', // Será hasheada pelo pre-save hook
            telefone: '(00) 00000-0000',
            instituicao: 'Escola Teste',
            role: 'user', // IMPORTANTE: role = user (cliente comum)
            licenca: licenca._id,
            ativo: true,
            aceitouTermos: true,
            dataAceiteTermos: new Date()
        });

        console.log('\n✅ Cliente criado com sucesso!');
        console.log('📧 Email: cliente@teste.com');
        console.log('🔑 Senha: 123456');
        console.log('📄 Licença: Trial (7 dias, 10 certificados)');
        console.log('\nFaça login com estas credenciais para testar o sistema!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

criarCliente();
