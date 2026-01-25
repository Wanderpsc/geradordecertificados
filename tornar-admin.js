// Script para tornar um usuário Admin
// Execute: node tornar-admin.js

require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('./server/models/Usuario');

const MONGODB_URI = process.env.MONGODB_URI;

async function tornarAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');

        // Digite o email do usuário que deseja tornar admin
        const email = process.argv[2];
        
        if (!email) {
            console.log('❌ Uso: node tornar-admin.js seu@email.com');
            process.exit(1);
        }

        const usuario = await Usuario.findOneAndUpdate(
            { email: email },
            { $set: { role: 'admin' } },
            { new: true }
        );

        if (usuario) {
            console.log(`✅ Usuário ${email} agora é ADMIN!`);
            console.log('Role:', usuario.role);
        } else {
            console.log(`❌ Usuário ${email} não encontrado`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

tornarAdmin();
