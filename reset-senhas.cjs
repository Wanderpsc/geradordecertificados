require('dotenv').config();
const mongoose = require('mongoose');

async function resetSenhas() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000
        });
        console.log('Conectado ao MongoDB!');

        const Usuario = require('./server/models/Usuario');

        // Reset Admin
        const admin = await Usuario.findOne({ email: 'wanderpsc@gmail.com' }).select('+senha');
        if (admin) {
            admin.senha = 'Wpsc2026@';
            admin.role = 'admin';
            admin.ativo = true;
            await admin.save(); // pre-save hook faz o hash
            console.log('✅ Admin (wanderpsc@gmail.com) - senha redefinida para: Wpsc2026@');
        } else {
            console.log('❌ Admin nao encontrado');
        }

        // Reset CETI
        const ceti = await Usuario.findOne({ email: 'wanderpsc2006@yahoo.com.br' }).select('+senha');
        if (ceti) {
            ceti.senha = 'Ceti@2026';
            ceti.ativo = true;
            await ceti.save(); // pre-save hook faz o hash
            console.log('✅ CETI (wanderpsc2006@yahoo.com.br) - senha redefinida para: Ceti@2026');
        } else {
            console.log('❌ CETI nao encontrado');
        }

        // Verificar se as senhas funcionam
        console.log('\n--- Verificando senhas ---');
        const adminCheck = await Usuario.findOne({ email: 'wanderpsc@gmail.com' }).select('+senha');
        const adminOk = await adminCheck.compararSenha('Wpsc2026@');
        console.log('Admin senha OK:', adminOk);

        const cetiCheck = await Usuario.findOne({ email: 'wanderpsc2006@yahoo.com.br' }).select('+senha');
        const cetiOk = await cetiCheck.compararSenha('Ceti@2026');
        console.log('CETI senha OK:', cetiOk);

        await mongoose.connection.close();
    } catch (error) {
        console.error('ERRO:', error.message);
    }
    process.exit(0);
}

resetSenhas();
