require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Aluno = require('./server/models/Aluno');
    const total = await Aluno.countDocuments();
    const dup = await Aluno.aggregate([
        { $group: { _id: { nome: '$nome', serie: '$serie', turma: '$turma' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
        { $match: { count: { $gt: 1 } } },
        { $limit: 5 }
    ]);
    console.log('Total alunos no banco:', total);
    if (dup.length === 0) {
        console.log('Nenhum duplicado encontrado por nome+serie+turma');
    } else {
        console.log('Grupos com duplicatas:', JSON.stringify(dup.map(d => ({ nome: d._id.nome, serie: d._id.serie, turma: d._id.turma, qtd: d.count })), null, 2));
    }
    mongoose.disconnect();
});
