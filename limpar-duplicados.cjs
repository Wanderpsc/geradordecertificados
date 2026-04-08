require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Aluno = require('./server/models/Aluno');

    // Buscar todos os grupos com duplicatas
    const grupos = await Aluno.aggregate([
        { $group: {
            _id: { nome: '$nome', serie: '$serie', turma: '$turma', usuario: '$usuario' },
            count: { $sum: 1 },
            ids: { $push: '$_id' },
            datas: { $push: '$criadoEm' }
        }},
        { $match: { count: { $gt: 1 } } }
    ]);

    console.log(`Grupos com duplicatas: ${grupos.length}`);

    let totalRemovidos = 0;

    for (const grupo of grupos) {
        // Ordenar IDs por data de criação (manter o primeiro / mais antigo)
        // Buscar os documentos do grupo para ordenar
        const docs = await Aluno.find({ _id: { $in: grupo.ids } }).sort({ criadoEm: 1 });
        const [manter, ...remover] = docs;
        if (remover.length > 0) {
            const idsRemover = remover.map(d => d._id);
            await Aluno.deleteMany({ _id: { $in: idsRemover } });
            console.log(`Mantido: ${manter.nome} (${manter.serie} / Turma ${manter.turma}) — removidos ${remover.length} duplicado(s)`);
            totalRemovidos += remover.length;
        }
    }

    const totalRestante = await Aluno.countDocuments();
    console.log(`\nConcluído! ${totalRemovidos} registros duplicados removidos. Total atual: ${totalRestante} alunos.`);
    mongoose.disconnect();
});
