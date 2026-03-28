// Script para criar admin via Render Shell
// Execute no Render Dashboard > Shell

const mongoose = require('mongoose');
const Usuario = require('./server/models/Usuario');

const criarAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // SUBSTITUA pelo seu email
    const emailAdmin = 'seu@email.com';

    const usuario = await Usuario.findOneAndUpdate(
      { email: emailAdmin },
      { role: 'admin' },
      { new: true }
    );

    if (usuario) {
      console.log('✅ Admin criado com sucesso!');
      console.log(`Email: ${usuario.email}`);
      console.log(`Role: ${usuario.role}`);
    } else {
      console.log('❌ Usuário não encontrado. Crie a conta primeiro!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
};

criarAdmin();
