const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Erro ao conectar MongoDB: ${error.message}`);
        console.error(`💡 Dica: Certifique-se de que o MongoDB está rodando localmente ou use MongoDB Atlas`);
        console.error(`📖 Veja QUICK_START.md para instruções de instalação`);
        process.exit(1);
    }
};

module.exports = connectDB;
