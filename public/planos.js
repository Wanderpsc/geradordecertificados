// Funções para Planos e Pagamentos

function abrirPagamento(tipo) {
    const area = document.getElementById('areaPagamentoPix');
    area.style.display = 'block';
    area.scrollIntoView({ behavior: 'smooth' });
}

function atualizarValorTotal() {
    const qtd = document.getElementById('qtdCertificados').value || 0;
    const total = qtd * 10;
    document.getElementById('valorTotal').textContent = `R$ ${total.toFixed(2)}`;
}

function gerarPixFake() {
    const qtd = document.getElementById('qtdCertificados').value;
    const total = qtd * 10;
    
    if (qtd < 1) {
        alert('Por favor, informe uma quantidade válida');
        return;
    }
    
    // Simulação de código Pix
    const codigoPix = `00020126580014BR.GOV.BCB.PIX0136certificados@pix.com52040000530398654${String(total.toFixed(2)).padStart(5, '0')}5802BR5925Gerador Certificados6009SAO PAULO62070503***6304${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    document.getElementById('codigoPix').textContent = codigoPix;
    document.getElementById('areaQRCode').style.display = 'block';
    
    showNotification(`✅ Código Pix gerado para ${qtd} certificados (R$ ${total.toFixed(2)})`, 'success');
}

function copiarCodigoPix() {
    const codigo = document.getElementById('codigoPix').textContent;
    navigator.clipboard.writeText(codigo).then(() => {
        showNotification('📋 Código Pix copiado!', 'success');
    });
}

// Função para imprimir lista de alunos
function imprimirListaAlunos() {
    const alunos = JSON.parse(localStorage.getItem('alunos') || '[]');
    
    if (alunos.length === 0) {
        alert('Nenhum aluno cadastrado para imprimir');
        return;
    }
    
    // Criar janela de impressão
    const janelaImpressao = window.open('', '_blank');
    
    const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Lista de Alunos para Correção</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    padding: 20px;
                    font-size: 11pt;
                }
                h1 {
                    color: #1e3a8a;
                    margin-bottom: 10px;
                    font-size: 20pt;
                    border-bottom: 3px solid #1e3a8a;
                    padding-bottom: 10px;
                }
                .info {
                    margin-bottom: 20px;
                    color: #6b7280;
                    font-size: 10pt;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th {
                    background: #1e3a8a;
                    color: white;
                    padding: 10px 8px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 10pt;
                }
                td {
                    padding: 8px;
                    border-bottom: 1px solid #e5e7eb;
                    font-size: 9pt;
                }
                tr:nth-child(even) {
                    background: #f9fafb;
                }
                .aluno-card {
                    page-break-inside: avoid;
                    border: 2px solid #e5e7eb;
                    padding: 15px;
                    margin-bottom: 15px;
                    border-radius: 8px;
                    background: white;
                }
                .aluno-card h3 {
                    color: #1e3a8a;
                    margin-bottom: 10px;
                    font-size: 13pt;
                }
                .aluno-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                .aluno-info div {
                    padding: 5px 0;
                }
                .label {
                    font-weight: 600;
                    color: #374151;
                    font-size: 9pt;
                }
                .value {
                    color: #6b7280;
                    font-size: 9pt;
                }
                .observacoes {
                    margin-top: 10px;
                    padding: 10px;
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    border-radius: 4px;
                    font-size: 9pt;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 2px solid #e5e7eb;
                    text-align: center;
                    color: #6b7280;
                    font-size: 9pt;
                }
                @media print {
                    body {
                        padding: 15mm;
                    }
                    .aluno-card {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <h1>📋 Lista de Alunos Cadastrados</h1>
            <div class="info">
                <strong>Total de Alunos:</strong> ${alunos.length} | 
                <strong>Data de Impressão:</strong> ${new Date().toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
            
            ${alunos.map((aluno, index) => `
                <div class="aluno-card">
                    <h3>${index + 1}. ${aluno.nomeAluno || 'Sem nome'}</h3>
                    <div class="aluno-info">
                        <div><span class="label">📧 RG:</span> <span class="value">${aluno.rgAluno || 'N/A'}</span></div>
                        <div><span class="label">🏛️ Órgão Emissor:</span> <span class="value">${aluno.orgaoEmissor || 'N/A'}</span></div>
                        <div><span class="label">📄 CPF:</span> <span class="value">${aluno.cpfAluno || 'N/A'}</span></div>
                        <div><span class="label">🎂 Nascimento:</span> <span class="value">${aluno.diaNascimento}/${aluno.mesNascimento}/${aluno.anoNascimento}</span></div>
                        <div><span class="label">🏙️ Naturalidade:</span> <span class="value">${aluno.cidadeNascimento}, ${aluno.estadoNascimento}</span></div>
                        <div><span class="label">📚 Curso:</span> <span class="value">${aluno.cursoCompleto || 'N/A'}</span></div>
                        <div><span class="label">📅 Início:</span> <span class="value">${aluno.diaInicio}/${aluno.mesInicio}/${aluno.anoInicio}</span></div>
                        <div><span class="label">✅ Conclusão:</span> <span class="value">${aluno.diaConclusao}/${aluno.mesConclusao}/${aluno.anoConclusao}</span></div>
                        <div><span class="label">⏱️ Carga Horária:</span> <span class="value">${aluno.cargaHoraria || 'N/A'}</span></div>
                        <div><span class="label">🏫 Instituição:</span> <span class="value">${aluno.nomeInstituicao || 'N/A'}</span></div>
                    </div>
                    ${aluno.observacoes ? `<div class="observacoes"><strong>💡 Observações:</strong> ${aluno.observacoes}</div>` : ''}
                </div>
            `).join('')}
            
            <div class="footer">
                <p><strong>© ${new Date().getFullYear()} Gerador de Certificados Profissional</strong></p>
                <p>Documento gerado automaticamente para correção e conferência de dados</p>
            </div>
            
            <script>
                window.print();
                // Fechar após impressão (opcional)
                // window.onafterprint = function() { window.close(); };
            </script>
        </body>
        </html>
    `;
    
    janelaImpressao.document.write(html);
    janelaImpressao.document.close();
}

// Adicionar event listener quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    // Botão de imprimir lista
    const btnImprimir = document.getElementById('btnImprimirLista');
    if (btnImprimir) {
        btnImprimir.addEventListener('click', imprimirListaAlunos);
    }
    
    // Atualizar valor total quando mudar quantidade
    const qtdInput = document.getElementById('qtdCertificados');
    if (qtdInput) {
        qtdInput.addEventListener('input', atualizarValorTotal);
    }
});
