const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Sanitizar URI - remover aspas, espaços e quebras de linha extras
        let mongoUri = (process.env.MONGODB_URI || '').trim().replace(/^["']|["']$/g, '').trim();
        
        // Log para diagnóstico (mostra apenas o início da URI)
        console.log(`🔗 MONGODB_URI começa com: "${mongoUri.substring(0, 20)}..." (tamanho: ${mongoUri.length})`);
        
        if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
            // Mostrar os primeiros caracteres em código para diagnosticar
            const charCodes = [...mongoUri.substring(0, 15)].map(c => c.charCodeAt(0));
            console.error(`⚠️  URI inválida! Primeiros char codes: [${charCodes.join(', ')}]`);
        }
        
        const conn = await mongoose.connect(mongoUri);

        console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Erro ao conectar MongoDB: ${error.message}`);
        console.error(`💡 Dica: Certifique-se de que o MongoDB está rodando localmente ou use MongoDB Atlas`);
        console.error(`📖 Veja QUICK_START.md para instruções de instalação`);
        process.exit(1);
    }
};

module.exports = connectDB;
