require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
    try {
        console.log('Tentando conectar ao MongoDB...');
        console.log('URI:', process.env.MONGODB_URI ? 'Definida' : 'NAO DEFINIDA');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000
        });
        console.log('Conectado ao MongoDB!');

        const Usuario = require('./server/models/Usuario');
        const users = await Usuario.find({}, 'email nome role ativo').lean();
        console.log('\nUsuarios encontrados:', users.length);
        users.forEach(u => {
            console.log(`  - ${u.email} | role: ${u.role} | ativo: ${u.ativo}`);
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error('ERRO:', error.message);
    }
    process.exit(0);
}

main();
