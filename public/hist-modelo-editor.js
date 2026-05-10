/**
 * EDITOR VISUAL DE MODELO DE HISTÓRICO ESCOLAR
 * Permite criar e customizar o layout do histórico com liberdade total.
 * Inclui: linhas editáveis, mesclagem, alinhamento, cabeçalho, assinatura, emblema, upload de modelo.
 */

// ==================== ESTADO DO EDITOR ====================
window.HIST_EDITOR = {
    modelo: null,         // objeto completo do modelo atual
    linhas: [],           // array de linhas da planilha principal
    cabecalho: {},        // config de cabeçalho
    rodape: {},           // config de rodapé/assinaturas
    emblema: {},          // config do emblema
    nomeAtual: '',        // nome do modelo sendo editado
    idAtual: null,        // id no banco (null = novo)
    arrastando: null,     // índice da linha sendo arrastada
    previewTimeout: null
};

// ==================== TIPOS DE LINHAS ====================
const HIST_ROW_TYPES = {
    cabecalho_topo: { label: 'Linha de Cabeçalho (País/Estado)', cor: '#1e3a8a', bg: '#dbeafe' },
    instituicao: { label: 'Nome da Instituição', cor: '#1e40af', bg: '#eff6ff' },
    titulo: { label: 'Título do Histórico', cor: '#ffffff', bg: '#1e3a8a' },
    dados_aluno: { label: 'Bloco de Dados do Aluno', cor: '#374151', bg: '#f8fafc' },
    cabecalho_tabela: { label: 'Cabeçalho da Tabela de Notas', cor: '#ffffff', bg: '#374151' },
    categoria: { label: 'Linha de Categoria', cor: '#1e3a8a', bg: '#e0e7ff' },
    subcategoria: { label: 'Linha de Subcategoria', cor: '#374151', bg: '#f1f5f9' },
    disciplina: { label: 'Linha de Disciplina', cor: '#111827', bg: '#ffffff' },
    total: { label: 'Linha de Total', cor: '#1e3a8a', bg: '#f0f9ff' },
    resultado: { label: 'Linha de Resultado Final', cor: '#065f46', bg: '#ecfdf5' },
    espaco: { label: 'Espaço em Branco', cor: '#9ca3af', bg: '#f9fafb' },
    assinatura: { label: 'Bloco de Assinaturas', cor: '#374151', bg: '#f8fafc' },
    local_data: { label: 'Local e Data', cor: '#374151', bg: '#f8fafc' },
    rodape_linha: { label: 'Linha de Rodapé Decorativa', cor: '#1e3a8a', bg: '#dbeafe' },
    texto_livre: { label: 'Texto Livre Personalizado', cor: '#374151', bg: '#fafafa' }
};

// ==================== MODELO PADRÃO ====================
function _histEditorModeloPadrao() {
    return {
        nome: 'Modelo Padrão',
        cabecalho: {
            linha1: 'REPÚBLICA FEDERATIVA DO BRASIL',
            linha2: 'ESTADO DO PIAUÍ',
            linha3: 'SECRETARIA DE ESTADO DA EDUCAÇÃO',
            nomeInstituicao: '',
            endereco: '',
            cnpj: '',
            inep: '',
            resolucao: '',
            fonteTamanho: 7,
            alinhamento: 'center'
        },
        emblema: {
            tipo: 'brasao-brasil',
            largura: 22,
            altura: 26,
            posicao: 'center'
        },
        tabela: {
            colunas: [
                { id: 'num', label: 'Nº', largura: 7, alinhH: 'center', alinhV: 'middle', bold: false },
                { id: 'subcategoria', label: 'COMPONENTES\nCURRICULARES\nPOR ÁREA', largura: 20, alinhH: 'center', alinhV: 'middle', bold: true },
                { id: 'disciplina', label: 'COMPONENTES\nCURRICULARES', largura: 36, alinhH: 'left', alinhV: 'middle', bold: false },
                { id: 'nota1', label: 'Nota\n1ª Série', largura: 15, alinhH: 'center', alinhV: 'middle', bold: false, serieIdx: 0 },
                { id: 'ch1', label: 'C.H.\n1ª Série', largura: 13, alinhH: 'center', alinhV: 'middle', bold: false, serieIdx: 0 },
                { id: 'nota2', label: 'Nota\n2ª Série', largura: 15, alinhH: 'center', alinhV: 'middle', bold: false, serieIdx: 1 },
                { id: 'ch2', label: 'C.H.\n2ª Série', largura: 13, alinhH: 'center', alinhV: 'middle', bold: false, serieIdx: 1 },
                { id: 'nota3', label: 'Nota\n3ª Série', largura: 15, alinhH: 'center', alinhV: 'middle', bold: false, serieIdx: 2 },
                { id: 'ch3', label: 'C.H.\n3ª Série', largura: 13, alinhH: 'center', alinhV: 'middle', bold: false, serieIdx: 2 },
                { id: 'total_ch', label: 'Total\nC.H.', largura: 12, alinhH: 'center', alinhV: 'middle', bold: true }
            ]
        },
        rodape: {
            assinatura1: { label: 'SECRETÁRIO(A)', posicaoX: 'left', linha: true },
            assinatura2: { label: 'DIRETOR(A)', posicaoX: 'right', linha: true },
            localData: '',
            mostrarCarimbo: true,
            mostrarLocalData: true
        },
        layout: {
            margemEsq: 12,
            margemDir: 12,
            margemTopo: 5,
            margemFundo: 10,
            corBorda: '#00287a',
            corCabecalho: '#00287a',
            corTexto: '#000000'
        }
    };
}

// ==================== ABRIR EDITOR ====================
function abrirEditorModeloHistorico(modeloExistente) {
    const modelo = modeloExistente ? JSON.parse(JSON.stringify(modeloExistente)) : _histEditorModeloPadrao();
    HIST_EDITOR.modelo = modelo;
    HIST_EDITOR.nomeAtual = modelo.nome || '';
    HIST_EDITOR.idAtual = modeloExistente?._id || null;

    const modal = document.createElement('div');
    modal.id = 'modalEditorHistModelo';
    modal.style.cssText = `
        position:fixed;top:0;left:0;right:0;bottom:0;
        background:rgba(0,0,0,0.75);z-index:10000;
        display:flex;align-items:stretch;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    `;

    modal.innerHTML = `
    <div style="display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;">
      <!-- BARRA SUPERIOR -->
      <div style="background:#1e3a8a;color:white;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:16px;font-weight:700;">🗒️ Editor de Modelo de Histórico</span>
          <input id="heNome" type="text" value="${escapeHtml(modelo.nome)}"
            style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);
            border-radius:6px;padding:4px 10px;font-size:13px;width:220px;"
            placeholder="Nome do modelo">
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <label style="cursor:pointer;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);
            border-radius:6px;padding:5px 12px;font-size:12px;font-weight:600;">
            📁 Importar JSON
            <input type="file" accept=".json" style="display:none" onchange="heImportarJSON(event)">
          </label>
          <button onclick="heExportarJSON()" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);
            color:white;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;">💾 Exportar JSON</button>
          <button onclick="heSalvarNuvem()" style="background:#059669;border:none;color:white;
            border-radius:6px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;">☁️ Salvar</button>
          <button onclick="document.getElementById('modalEditorHistModelo').remove()"
            style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);color:white;
            border-radius:6px;padding:5px 10px;font-size:14px;cursor:pointer;">✕</button>
        </div>
      </div>

      <!-- ÁREA PRINCIPAL: PAINEL ESQUERDO + PREVIEW DIREITO -->
      <div style="display:flex;flex:1;overflow:hidden;">

        <!-- PAINEL ESQUERDO (abas) -->
        <div style="width:420px;min-width:320px;max-width:480px;background:#f8fafc;border-right:2px solid #e5e7eb;
          display:flex;flex-direction:column;overflow:hidden;">
          <!-- Abas -->
          <div style="display:flex;gap:0;border-bottom:2px solid #e5e7eb;flex-shrink:0;overflow-x:auto;">
            ${['cabecalho','emblema','colunas','rodape','layout'].map((t,i)=>
              `<button class="he-aba" data-aba="${t}" onclick="heTrocarAba('${t}')"
                style="padding:8px 12px;border:none;background:${i===0?'white':'transparent'};
                font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;
                border-bottom:${i===0?'2px solid #1e3a8a':'none'};color:${i===0?'#1e3a8a':'#6b7280'};">
                ${{cabecalho:'📋 Cabeçalho',emblema:'🏛️ Emblema',colunas:'📊 Colunas',rodape:'✍️ Rodapé',layout:'🎨 Layout'}[t]}
              </button>`
            ).join('')}
          </div>
          <!-- Conteúdo da aba -->
          <div id="hePainelAba" style="flex:1;overflow-y:auto;padding:14px;"></div>
        </div>

        <!-- PREVIEW DIREITO -->
        <div style="flex:1;background:#e5e7eb;display:flex;flex-direction:column;overflow:hidden;">
          <div style="padding:10px 16px;background:white;border-bottom:1px solid #e5e7eb;
            display:flex;gap:8px;align-items:center;flex-shrink:0;">
            <span style="font-size:12px;font-weight:700;color:#374151;">Pré-visualização do Layout</span>
            <button onclick="heGerarPreview()" style="background:#3b82f6;color:white;border:none;
              border-radius:6px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;">↺ Atualizar</button>
            <span style="font-size:11px;color:#9ca3af;">A preview reflete o layout da planilha. Dados de aluno e notas são fictícios.</span>
          </div>
          <div style="flex:1;overflow:auto;padding:16px;display:flex;justify-content:center;align-items:flex-start;">
            <canvas id="hePreviewCanvas"
              style="background:white;box-shadow:0 4px 20px rgba(0,0,0,0.2);max-width:100%;cursor:default;">
            </canvas>
          </div>
        </div>

      </div>
    </div>`;

    document.body.appendChild(modal);
    heTrocarAba('cabecalho');
    setTimeout(heGerarPreview, 100);
}

// ==================== TROCAR ABA ====================
function heTrocarAba(aba) {
    document.querySelectorAll('.he-aba').forEach(btn => {
        const isActive = btn.dataset.aba === aba;
        btn.style.background = isActive ? 'white' : 'transparent';
        btn.style.borderBottom = isActive ? '2px solid #1e3a8a' : 'none';
        btn.style.color = isActive ? '#1e3a8a' : '#6b7280';
    });
    const painel = document.getElementById('hePainelAba');
    if (!painel) return;
    const modelo = HIST_EDITOR.modelo;

    if (aba === 'cabecalho') {
        const c = modelo.cabecalho || {};
        painel.innerHTML = `
        <h3 style="margin:0 0 12px;color:#1e3a8a;font-size:13px;">📋 Cabeçalho do Histórico</h3>
        ${_heField('Linha 1 (País)', 'heCabLinha1', c.linha1||'', 'text', 'REPÚBLICA FEDERATIVA DO BRASIL')}
        ${_heField('Linha 2 (Estado)', 'heCabLinha2', c.linha2||'', 'text', 'ESTADO DO PIAUÍ')}
        ${_heField('Linha 3 (Secretaria)', 'heCabLinha3', c.linha3||'', 'text', 'SECRETARIA DE ESTADO DA EDUCAÇÃO')}
        ${_heField('Nome da Instituição', 'heCabInst', c.nomeInstituicao||'', 'text', 'Ex: Centro Estadual...')}
        ${_heField('Endereço', 'heCabEnd', c.endereco||'', 'text', 'Ex: Praça Tiradentes...')}
        ${_heField('CNPJ', 'heCabCNPJ', c.cnpj||'', 'text', '00.000.000/0001-00')}
        ${_heField('INEP', 'heCabINEP', c.inep||'', 'text', '00000000')}
        ${_heField('Resolução', 'heCabResol', c.resolucao||'', 'text', 'Ex: Res. CEE/PI Nº 123/2025')}
        ${_heField('Tamanho da Fonte do Cabeçalho (pt)', 'heCabFonte', c.fonteTamanho||7, 'number', '7')}
        <div style="margin-bottom:12px;">
          <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Alinhamento do Texto</label>
          <div style="display:flex;gap:6px;">
            ${['left','center','right'].map(a=>`
              <button onclick="heSetCabAlinhamento('${a}')" id="heCabAlinh_${a}"
                style="flex:1;padding:6px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;
                border:2px solid ${(c.alinhamento||'center')===a?'#1e3a8a':'#e5e7eb'};
                background:${(c.alinhamento||'center')===a?'#eff6ff':'white'};color:#374151;">
                ${{left:'⬅ Esq',center:'↔ Centro',right:'Dir ➡'}[a]}</button>`).join('')}
          </div>
        </div>
        <button onclick="heSalvarAba('cabecalho')"
          style="width:100%;background:#1e3a8a;color:white;border:none;border-radius:8px;
          padding:10px;font-size:13px;font-weight:700;cursor:pointer;margin-top:8px;">
          ✔ Aplicar Cabeçalho</button>
        `;
    } else if (aba === 'emblema') {
        const e = modelo.emblema || {};
        painel.innerHTML = `
        <h3 style="margin:0 0 12px;color:#1e3a8a;font-size:13px;">🏛️ Emblema / Brasão</h3>
        <div style="margin-bottom:12px;">
          <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Tipo de Emblema</label>
          <select id="heEmbTipo" class="form-control" style="font-size:12px;" onchange="document.getElementById('heEmbUploadWrap').style.display=this.value==='custom'?'block':'none'">
            <option value="brasao-brasil" ${(e.tipo||'brasao-brasil')==='brasao-brasil'?'selected':''}>Brasão da República</option>
            <option value="custom" ${e.tipo==='custom'?'selected':''}>Emblema Personalizado</option>
            <option value="nenhum" ${e.tipo==='nenhum'?'selected':''}>Sem Emblema</option>
          </select>
        </div>
        <div id="heEmbUploadWrap" style="margin-bottom:12px;display:${e.tipo==='custom'?'block':'none'};">
          <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Upload do Emblema (PNG/JPG)</label>
          <input type="file" id="heEmbUpload" accept="image/png,image/jpeg,image/webp" class="form-control" onchange="heUploadEmblema(event)">
          <div id="heEmbPreview" style="margin-top:8px;">
            ${(HIST_UPLOADS||{}).emblemaCustom ? `<img src="${(HIST_UPLOADS||{}).emblemaCustom}" style="max-height:60px;border-radius:6px;">` : ''}
          </div>
        </div>
        ${_heField('Largura (mm)', 'heEmbLarg', e.largura||22, 'number', '22')}
        ${_heField('Altura (mm)', 'heEmbAlt', e.altura||26, 'number', '26')}
        <div style="margin-bottom:12px;">
          <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Posição Horizontal</label>
          <div style="display:flex;gap:6px;">
            ${['left','center','right'].map(p=>`
              <button onclick="heSetEmbPos('${p}')" id="heEmbPos_${p}"
                style="flex:1;padding:6px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;
                border:2px solid ${(e.posicao||'center')===p?'#1e3a8a':'#e5e7eb'};
                background:${(e.posicao||'center')===p?'#eff6ff':'white'};color:#374151;">
                ${{left:'⬅ Esq',center:'↔ Centro',right:'Dir ➡'}[p]}</button>`).join('')}
          </div>
        </div>
        <button onclick="heSalvarAba('emblema')"
          style="width:100%;background:#1e3a8a;color:white;border:none;border-radius:8px;
          padding:10px;font-size:13px;font-weight:700;cursor:pointer;margin-top:8px;">
          ✔ Aplicar Emblema</button>
        `;
    } else if (aba === 'colunas') {
        const cols = modelo.tabela?.colunas || [];
        painel.innerHTML = `
        <h3 style="margin:0 0 8px;color:#1e3a8a;font-size:13px;">📊 Colunas da Tabela de Notas</h3>
        <p style="font-size:11px;color:#6b7280;margin:0 0 12px;">Arraste as linhas para reordenar. Edite rótulo, largura e alinhamento de cada coluna.</p>
        <div style="margin-bottom:10px;display:flex;gap:6px;">
          <button onclick="heAdicionarColuna()" style="background:#059669;color:white;border:none;border-radius:6px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;">+ Coluna</button>
        </div>
        <div id="heColunasLista" style="display:flex;flex-direction:column;gap:6px;">
          ${cols.map((col, idx) => _heRenderColuna(col, idx)).join('')}
        </div>
        <div style="margin-top:12px;padding:10px;background:#eff6ff;border-radius:8px;font-size:11px;color:#1e3a8a;">
          <strong>Largura total disponível: ~186mm (A4 210mm − margens 24mm)</strong><br>
          Atual: <span id="heLargTotal">${cols.reduce((s,c)=>s+(c.largura||0),0)}</span>mm
        </div>
        <button onclick="heSalvarAba('colunas')"
          style="width:100%;background:#1e3a8a;color:white;border:none;border-radius:8px;
          padding:10px;font-size:13px;font-weight:700;cursor:pointer;margin-top:12px;">
          ✔ Aplicar Colunas</button>
        `;
        _heInitDragColunas();
    } else if (aba === 'rodape') {
        const r = modelo.rodape || {};
        const a1 = r.assinatura1 || {};
        const a2 = r.assinatura2 || {};
        painel.innerHTML = `
        <h3 style="margin:0 0 12px;color:#1e3a8a;font-size:13px;">✍️ Rodapé e Assinaturas</h3>
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:12px;">
          <div style="font-weight:700;font-size:12px;color:#374151;margin-bottom:8px;">Assinatura Esquerda</div>
          ${_heField('Cargo / Texto', 'heAssin1Label', a1.label||'SECRETÁRIO(A)', 'text')}
          <div style="margin-bottom:8px;">
            <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Posição Horizontal</label>
            <div style="display:flex;gap:6px;">
              ${['left','center','right'].map(p=>`
                <button onclick="heSetSigPos(1,'${p}')" id="heSig1Pos_${p}"
                  style="flex:1;padding:5px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;
                  border:2px solid ${(a1.posicaoX||'left')===p?'#1e3a8a':'#e5e7eb'};
                  background:${(a1.posicaoX||'left')===p?'#eff6ff':'white'};color:#374151;">
                  ${{left:'Esq',center:'Centro',right:'Dir'}[p]}</button>`).join('')}
            </div>
          </div>
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;">
            <input type="checkbox" id="heAssin1Linha" ${a1.linha!==false?'checked':''}>
            Mostrar linha (traço) acima da assinatura
          </label>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:12px;">
          <div style="font-weight:700;font-size:12px;color:#374151;margin-bottom:8px;">Assinatura Direita</div>
          ${_heField('Cargo / Texto', 'heAssin2Label', a2.label||'DIRETOR(A)', 'text')}
          <div style="margin-bottom:8px;">
            <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Posição Horizontal</label>
            <div style="display:flex;gap:6px;">
              ${['left','center','right'].map(p=>`
                <button onclick="heSetSigPos(2,'${p}')" id="heSig2Pos_${p}"
                  style="flex:1;padding:5px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;
                  border:2px solid ${(a2.posicaoX||'right')===p?'#1e3a8a':'#e5e7eb'};
                  background:${(a2.posicaoX||'right')===p?'#eff6ff':'white'};color:#374151;">
                  ${{left:'Esq',center:'Centro',right:'Dir'}[p]}</button>`).join('')}
            </div>
          </div>
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;">
            <input type="checkbox" id="heAssin2Linha" ${a2.linha!==false?'checked':''}>
            Mostrar linha (traço) acima da assinatura
          </label>
        </div>
        ${_heField('Local e Data', 'heLocalData', r.localData||'', 'text', 'Ex: Curimatá - PI, 22 de dezembro de 2025')}
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;margin-bottom:8px;">
          <input type="checkbox" id="heMostrarLocalData" ${r.mostrarLocalData!==false?'checked':''}>
          Mostrar campo Local e Data
        </label>
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;margin-bottom:12px;">
          <input type="checkbox" id="heMostrarCarimbo" ${r.mostrarCarimbo!==false?'checked':''}>
          Mostrar espaço para carimbo
        </label>
        <button onclick="heSalvarAba('rodape')"
          style="width:100%;background:#1e3a8a;color:white;border:none;border-radius:8px;
          padding:10px;font-size:13px;font-weight:700;cursor:pointer;">
          ✔ Aplicar Rodapé</button>
        `;
    } else if (aba === 'layout') {
        const l = modelo.layout || {};
        painel.innerHTML = `
        <h3 style="margin:0 0 12px;color:#1e3a8a;font-size:13px;">🎨 Layout e Margens</h3>
        ${_heField('Margem Esquerda (mm)', 'heMargEsq', l.margemEsq||12, 'number')}
        ${_heField('Margem Direita (mm)', 'heMargDir', l.margemDir||12, 'number')}
        ${_heField('Margem Superior (mm)', 'heMargTopo', l.margemTopo||5, 'number')}
        ${_heField('Margem Inferior (mm)', 'heMargFundo', l.margemFundo||10, 'number')}
        <div style="margin-bottom:12px;">
          <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Cor de Borda/Linhas</label>
          <input type="color" id="heCorBorda" value="${l.corBorda||'#00287a'}"
            style="width:60px;height:36px;border-radius:6px;border:1px solid #e5e7eb;cursor:pointer;">
        </div>
        <div style="margin-bottom:12px;">
          <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Cor de Fundo do Cabeçalho da Tabela</label>
          <input type="color" id="heCorCabecalhoTab" value="${l.corCabecalho||'#00287a'}"
            style="width:60px;height:36px;border-radius:6px;border:1px solid #e5e7eb;cursor:pointer;">
        </div>
        <div style="margin-bottom:12px;">
          <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Cor Principal do Texto</label>
          <input type="color" id="heCorTexto" value="${l.corTexto||'#000000'}"
            style="width:60px;height:36px;border-radius:6px;border:1px solid #e5e7eb;cursor:pointer;">
        </div>
        <button onclick="heSalvarAba('layout')"
          style="width:100%;background:#1e3a8a;color:white;border:none;border-radius:8px;
          padding:10px;font-size:13px;font-weight:700;cursor:pointer;margin-top:8px;">
          ✔ Aplicar Layout</button>
        `;
    }
}

// ==================== HELPERS DE FORMULÁRIO ====================
function _heField(label, id, val, type='text', placeholder='') {
    return `
    <div style="margin-bottom:10px;">
      <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">${label}</label>
      <input type="${type}" id="${id}" value="${escapeHtml ? escapeHtml(String(val)) : String(val)}"
        class="form-control" style="font-size:12px;" placeholder="${placeholder}"
        oninput="heAutoPreview()">
    </div>`;
}

function _heRenderColuna(col, idx) {
    return `
    <div class="he-col-item" data-idx="${idx}" draggable="true"
      style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;cursor:grab;">
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
        <span style="color:#9ca3af;font-size:14px;cursor:grab;" title="Arrastar">⠿</span>
        <input type="text" value="${escapeHtml ? escapeHtml(col.label||'') : (col.label||'')}"
          placeholder="Rótulo da coluna" data-col-prop="label" data-col-idx="${idx}"
          style="flex:1;font-size:11px;padding:4px 6px;border:1px solid #e5e7eb;border-radius:4px;font-weight:600;"
          oninput="heUpdateColuna(${idx},'label',this.value)">
        <button onclick="heRemoverColuna(${idx})"
          style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:4px;padding:2px 6px;font-size:12px;cursor:pointer;">✕</button>
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
        <label style="font-size:10px;color:#6b7280;">Largura(mm)</label>
        <input type="number" value="${col.largura||10}" min="5" max="80"
          style="width:55px;font-size:11px;padding:3px 5px;border:1px solid #e5e7eb;border-radius:4px;"
          oninput="heUpdateColuna(${idx},'largura',parseFloat(this.value)||10)">
        <label style="font-size:10px;color:#6b7280;">Alinhamento H</label>
        <select style="font-size:10px;padding:2px;" onchange="heUpdateColuna(${idx},'alinhH',this.value)">
          ${['left','center','right'].map(a=>`<option value="${a}" ${(col.alinhH||'left')===a?'selected':''}>${{left:'Esq',center:'Centro',right:'Dir'}[a]}</option>`).join('')}
        </select>
        <label style="display:flex;align-items:center;gap:4px;font-size:10px;color:#6b7280;cursor:pointer;">
          <input type="checkbox" ${col.bold?'checked':''} onchange="heUpdateColuna(${idx},'bold',this.checked)"> Negrito
        </label>
      </div>
    </div>`;
}

// ==================== DRAG & DROP COLUNAS ====================
function _heInitDragColunas() {
    setTimeout(() => {
        const lista = document.getElementById('heColunasLista');
        if (!lista) return;
        let dragSrc = null;
        lista.querySelectorAll('.he-col-item').forEach(el => {
            el.addEventListener('dragstart', e => {
                dragSrc = el;
                el.style.opacity = '0.4';
                e.dataTransfer.effectAllowed = 'move';
            });
            el.addEventListener('dragend', () => { el.style.opacity = '1'; dragSrc = null; });
            el.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
            el.addEventListener('drop', e => {
                e.preventDefault();
                if (!dragSrc || dragSrc === el) return;
                const fromIdx = parseInt(dragSrc.dataset.idx);
                const toIdx = parseInt(el.dataset.idx);
                const cols = HIST_EDITOR.modelo.tabela.colunas;
                const [moved] = cols.splice(fromIdx, 1);
                cols.splice(toIdx, 0, moved);
                heTrocarAba('colunas');
                heGerarPreview();
            });
        });
    }, 100);
}

// ==================== ATUALIZAR COLUNA ====================
function heUpdateColuna(idx, prop, val) {
    const cols = HIST_EDITOR.modelo.tabela?.colunas;
    if (!cols || !cols[idx]) return;
    cols[idx][prop] = val;
    // Atualizar total largura
    const total = cols.reduce((s, c) => s + (c.largura || 0), 0);
    const el = document.getElementById('heLargTotal');
    if (el) el.textContent = Math.round(total * 10) / 10;
    heAutoPreview();
}

function heAdicionarColuna() {
    const cols = HIST_EDITOR.modelo.tabela?.colunas;
    if (!cols) return;
    cols.push({ id: 'col_' + Date.now(), label: 'Nova Coluna', largura: 15, alinhH: 'center', alinhV: 'middle', bold: false });
    heTrocarAba('colunas');
    heGerarPreview();
}

function heRemoverColuna(idx) {
    const cols = HIST_EDITOR.modelo.tabela?.colunas;
    if (!cols) return;
    cols.splice(idx, 1);
    heTrocarAba('colunas');
    heGerarPreview();
}

// ==================== SETTERS DE POSIÇÃO ====================
function heSetCabAlinhamento(alinhamento) {
    HIST_EDITOR.modelo.cabecalho.alinhamento = alinhamento;
    heTrocarAba('cabecalho');
    heAutoPreview();
}
function heSetEmbPos(pos) {
    HIST_EDITOR.modelo.emblema.posicao = pos;
    heTrocarAba('emblema');
    heAutoPreview();
}
function heSetSigPos(num, pos) {
    if (num === 1) HIST_EDITOR.modelo.rodape.assinatura1.posicaoX = pos;
    else HIST_EDITOR.modelo.rodape.assinatura2.posicaoX = pos;
    heTrocarAba('rodape');
    heAutoPreview();
}

// ==================== SALVAR ABA ====================
function heSalvarAba(aba) {
    const modelo = HIST_EDITOR.modelo;
    if (aba === 'cabecalho') {
        modelo.cabecalho = {
            linha1: document.getElementById('heCabLinha1')?.value || '',
            linha2: document.getElementById('heCabLinha2')?.value || '',
            linha3: document.getElementById('heCabLinha3')?.value || '',
            nomeInstituicao: document.getElementById('heCabInst')?.value || '',
            endereco: document.getElementById('heCabEnd')?.value || '',
            cnpj: document.getElementById('heCabCNPJ')?.value || '',
            inep: document.getElementById('heCabINEP')?.value || '',
            resolucao: document.getElementById('heCabResol')?.value || '',
            fonteTamanho: parseFloat(document.getElementById('heCabFonte')?.value) || 7,
            alinhamento: modelo.cabecalho?.alinhamento || 'center'
        };
    } else if (aba === 'emblema') {
        modelo.emblema = {
            tipo: document.getElementById('heEmbTipo')?.value || 'brasao-brasil',
            largura: parseFloat(document.getElementById('heEmbLarg')?.value) || 22,
            altura: parseFloat(document.getElementById('heEmbAlt')?.value) || 26,
            posicao: modelo.emblema?.posicao || 'center'
        };
    } else if (aba === 'rodape') {
        modelo.rodape = {
            assinatura1: {
                label: document.getElementById('heAssin1Label')?.value || 'SECRETÁRIO(A)',
                posicaoX: modelo.rodape?.assinatura1?.posicaoX || 'left',
                linha: document.getElementById('heAssin1Linha')?.checked !== false
            },
            assinatura2: {
                label: document.getElementById('heAssin2Label')?.value || 'DIRETOR(A)',
                posicaoX: modelo.rodape?.assinatura2?.posicaoX || 'right',
                linha: document.getElementById('heAssin2Linha')?.checked !== false
            },
            localData: document.getElementById('heLocalData')?.value || '',
            mostrarLocalData: document.getElementById('heMostrarLocalData')?.checked !== false,
            mostrarCarimbo: document.getElementById('heMostrarCarimbo')?.checked !== false
        };
    } else if (aba === 'layout') {
        modelo.layout = {
            margemEsq: parseFloat(document.getElementById('heMargEsq')?.value) || 12,
            margemDir: parseFloat(document.getElementById('heMargDir')?.value) || 12,
            margemTopo: parseFloat(document.getElementById('heMargTopo')?.value) || 5,
            margemFundo: parseFloat(document.getElementById('heMargFundo')?.value) || 10,
            corBorda: document.getElementById('heCorBorda')?.value || '#00287a',
            corCabecalho: document.getElementById('heCorCabecalhoTab')?.value || '#00287a',
            corTexto: document.getElementById('heCorTexto')?.value || '#000000'
        };
    }
    mostrarNotificacao?.('Configurações aplicadas! Gerando preview...', 'success');
    heGerarPreview();
}

// ==================== AUTO PREVIEW ====================
function heAutoPreview() {
    clearTimeout(HIST_EDITOR.previewTimeout);
    HIST_EDITOR.previewTimeout = setTimeout(heGerarPreview, 600);
}

// ==================== UPLOAD DO EMBLEMA ====================
function heUploadEmblema(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        if (!HIST_UPLOADS) window.HIST_UPLOADS = {};
        HIST_UPLOADS.emblemaCustom = e.target.result;
        localStorage.setItem('histUploads', JSON.stringify(HIST_UPLOADS));
        const prev = document.getElementById('heEmbPreview');
        if (prev) prev.innerHTML = `<img src="${e.target.result}" style="max-height:60px;border-radius:6px;">`;
        HIST_EDITOR.modelo.emblema.tipo = 'custom';
        mostrarNotificacao?.('Emblema carregado!', 'success');
        heGerarPreview();
    };
    reader.readAsDataURL(file);
}

// ==================== GERAÇÃO DE PREVIEW NO CANVAS ====================
function heGerarPreview() {
    const canvas = document.getElementById('hePreviewCanvas');
    if (!canvas) return;

    // Escala: 1mm = 2.83px (aprox.) → A4 210x297mm
    const SCALE = 2.2;
    const PW_MM = 210, PH_MM = 297;
    canvas.width = Math.round(PW_MM * SCALE);
    canvas.height = Math.round(PH_MM * SCALE);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const M = HIST_EDITOR.modelo || _histEditorModeloPadrao();
    const S = SCALE;
    const ML = (M.layout?.margemEsq || 12) * S;
    const MR = (M.layout?.margemDir || 12) * S;
    const MT = (M.layout?.margemTopo || 5) * S;
    const UW = canvas.width - ML - MR;
    const corBorda = M.layout?.corBorda || '#00287a';
    const corCab = M.layout?.corCabecalho || '#00287a';

    let y = MT;

    // Linhas duplas no topo
    ctx.strokeStyle = corBorda; ctx.lineWidth = 1.5 * S / 3.78;
    ctx.beginPath(); ctx.moveTo(ML, y); ctx.lineTo(ML + UW, y); ctx.stroke();
    y += 1.5 * S / 3.78;
    ctx.lineWidth = 0.5 * S / 3.78;
    ctx.beginPath(); ctx.moveTo(ML, y); ctx.lineTo(ML + UW, y); ctx.stroke();
    y += 1 * S / 3.78;

    // Emblema
    const emb = M.emblema || {};
    const embW = (emb.largura || 22) * S;
    const embH = (emb.altura || 26) * S;
    const embTipo = emb.tipo || 'brasao-brasil';
    const embPos = emb.posicao || 'center';
    let embX = ML + (UW - embW) / 2;
    if (embPos === 'left') embX = ML;
    if (embPos === 'right') embX = ML + UW - embW;

    const _drawEmblema = (dataUrl) => {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, embX, y, embW, embH);
            _heDrawCabTextos(ctx, canvas, M, ML, UW, S, y + embH, corBorda, corCab);
        };
        img.src = dataUrl;
    };

    if (embTipo === 'custom' && (HIST_UPLOADS||{}).emblemaCustom) {
        _drawEmblema(HIST_UPLOADS.emblemaCustom);
    } else if (embTipo === 'brasao-brasil' && typeof BRASAO_BRASIL !== 'undefined') {
        _drawEmblema(BRASAO_BRASIL);
    } else {
        // Placeholder cinza
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(embX, y, embW, embH);
        ctx.fillStyle = '#9ca3af'; ctx.font = `${9*S/3.78}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('EMBLEMA', embX + embW/2, y + embH/2);
        _heDrawCabTextos(ctx, canvas, M, ML, UW, S, y + embH, corBorda, corCab);
    }
}

function _heDrawCabTextos(ctx, canvas, M, ML, UW, S, yAfterEmb, corBorda, corCab) {
    const cab = M.cabecalho || {};
    const alinhH = cab.alinhamento || 'center';
    const fs = (cab.fonteTamanho || 7) * S / 3.78;
    let y = yAfterEmb + 2 * S / 3.78;

    ctx.textAlign = alinhH === 'center' ? 'center' : alinhH === 'right' ? 'right' : 'left';
    const tx = alinhH === 'center' ? ML + UW/2 : alinhH === 'right' ? ML + UW : ML;

    const writeText = (text, bold=false, size=fs) => {
        if (!text) return;
        ctx.font = `${bold?'bold ':''} ${size}px sans-serif`;
        ctx.fillStyle = '#000000';
        ctx.fillText(text, tx, y);
        y += size * 1.4;
    };

    writeText(cab.linha1 || 'REPÚBLICA FEDERATIVA DO BRASIL', true);
    writeText(cab.linha2 || 'ESTADO DO PIAUÍ', true);
    writeText(cab.linha3 || 'SECRETARIA DE ESTADO DA EDUCAÇÃO');
    writeText(cab.nomeInstituicao);
    writeText(cab.endereco);
    if (cab.resolucao) {
        const resolTxt = 'Resolução CEE/PI Nº ' + cab.resolucao.replace(/^resolu[çc][aã]o\s+cee\/pi\s*/i,'').trim();
        writeText(resolTxt);
    }

    y += 3 * S / 3.78;

    // Título do histórico (barra azul)
    const tituloH = 6 * S / 3.78;
    ctx.fillStyle = corCab;
    ctx.fillRect(ML, y, UW, tituloH);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${7 * S / 3.78}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('HISTÓRICO ESCOLAR – ENSINO MÉDIO', ML + UW/2, y + tituloH * 0.65);
    y += tituloH + 2 * S / 3.78;

    // Bloco de dados fictícios do aluno
    const dadosH = 20 * S / 3.78;
    ctx.strokeStyle = corBorda; ctx.lineWidth = 0.5;
    ctx.strokeRect(ML, y, UW, dadosH);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(ML, y, UW, dadosH);
    ctx.fillStyle = '#6b7280'; ctx.font = `${6 * S / 3.78}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('ESTUDANTE: _________________________________   RG: ______   CPF: ___________', ML + 2, y + dadosH * 0.25);
    ctx.fillText('DATA NASCIMENTO: ___________   NATURALIDADE: _____________   NACIONALIDADE: _________', ML + 2, y + dadosH * 0.5);
    ctx.fillText('FILIAÇÃO: __________________________________________', ML + 2, y + dadosH * 0.75);
    y += dadosH + 3 * S / 3.78;

    // Tabela de notas
    _heDrawTabelaPreview(ctx, ML, y, UW, S, M, corBorda, corCab);

    // Rodapé
    const canvas_h = canvas.height;
    const rodapeY = canvas_h - 45 * S / 3.78;
    _heDrawRodapePreview(ctx, ML, UW, canvas.width, S, M, rodapeY, corBorda);
}

function _heDrawTabelaPreview(ctx, x, y, UW, S, M, corBorda, corCab) {
    const cols = M.tabela?.colunas || [];
    const totalCols = cols.reduce((s, c) => s + (c.largura || 0), 0);
    const scaleW = totalCols > 0 ? UW / (totalCols * S / 3.78) : 1;

    // Cabeçalho da tabela
    const cabH = 10 * S / 3.78;
    ctx.fillStyle = corCab;
    ctx.fillRect(x, y, UW, cabH);
    let cx = x;
    cols.forEach(col => {
        const cw = (col.largura || 10) * S / 3.78 * scaleW;
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.5;
        ctx.strokeRect(cx, y, cw, cabH);
        ctx.fillStyle = '#ffffff';
        ctx.font = `${col.bold ? 'bold ' : ''}${5.5 * S / 3.78}px sans-serif`;
        ctx.textAlign = 'center';
        const label = (col.label || '').replace(/\n/g, ' ');
        ctx.fillText(label.length > 12 ? label.substring(0,12)+'…' : label, cx + cw/2, y + cabH * 0.6);
        cx += cw;
    });
    y += cabH;

    // Linhas de disciplina (fictícias)
    const ficticias = ['Língua Portuguesa','Matemática','Física','Química','Biologia','História','Geografia','Filosofia','Sociologia'];
    const cats = ['FORMAÇÃO GERAL BÁSICA', 'ITINERÁRIOS FORMATIVOS'];
    let catIdx = 0;

    [cats[0], ...ficticias.slice(0,5), cats[1], ...ficticias.slice(5)].forEach((item, ii) => {
        const iscat = cats.includes(item);
        const rh = iscat ? (6 * S / 3.78) : (4.5 * S / 3.78);
        ctx.fillStyle = iscat ? '#e0e7ff' : (ii % 2 === 0 ? '#ffffff' : '#f9fafb');
        ctx.fillRect(x, y, UW, rh);
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 0.3;
        ctx.strokeRect(x, y, UW, rh);
        ctx.fillStyle = iscat ? '#1e3a8a' : '#374151';
        ctx.font = `${iscat ? 'bold ' : ''}${5 * S / 3.78}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(item, x + 3, y + rh * 0.65);
        if (!iscat) {
            // Dados fictícios por coluna
            let dcx = x;
            cols.forEach(col => {
                const cw = (col.largura || 10) * S / 3.78 * scaleW;
                if (col.id !== 'num' && col.id !== 'subcategoria' && col.id !== 'disciplina') {
                    ctx.textAlign = 'center';
                    ctx.font = `${4.5 * S / 3.78}px sans-serif`;
                    ctx.fillText(col.id?.includes('nota') ? (7 + ii % 3) : '80', dcx + cw/2, y + rh * 0.65);
                }
                dcx += cw;
            });
        }
        y += rh;
    });

    // Linha de total
    const totH = 5 * S / 3.78;
    ctx.fillStyle = '#f0f9ff';
    ctx.fillRect(x, y, UW, totH);
    ctx.strokeStyle = corBorda; ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, UW, totH);
    ctx.fillStyle = '#1e3a8a'; ctx.font = `bold ${5 * S / 3.78}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('TOTAL CARGA HORÁRIA', x + 2, y + totH * 0.65);
}

function _heDrawRodapePreview(ctx, ML, UW, canvasW, S, M, rodapeY, corBorda) {
    const r = M.rodape || {};
    const a1 = r.assinatura1 || {};
    const a2 = r.assinatura2 || {};
    const sig1 = a1.label || 'SECRETÁRIO(A)';
    const sig2 = a2.label || 'DIRETOR(A)';
    const sigLineW = 70 * S / 3.78;

    // Local e Data
    if (r.mostrarLocalData !== false && r.localData) {
        ctx.fillStyle = '#374151'; ctx.font = `${6 * S / 3.78}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(r.localData, ML + UW/2, rodapeY);
    }

    // Assinaturas
    const sigY = rodapeY + 15 * S / 3.78;
    [[sig1, a1.posicaoX || 'left'], [sig2, a2.posicaoX || 'right']].forEach(([sig, pos]) => {
        let sx;
        if (pos === 'left') sx = ML + UW * 0.25;
        else if (pos === 'right') sx = ML + UW * 0.75;
        else sx = ML + UW * 0.5;
        ctx.strokeStyle = corBorda; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(sx - sigLineW/2, sigY); ctx.lineTo(sx + sigLineW/2, sigY); ctx.stroke();
        ctx.fillStyle = '#374151'; ctx.font = `bold ${6 * S / 3.78}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(sig, sx, sigY + 9 * S / 3.78);
    });

    // Linhas duplas no fundo
    const fy = ML + UW + 10 * S / 3.78;
    const fy2 = canvasW - ML - 10;
    ctx.strokeStyle = corBorda; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ML, fy2 - 10); ctx.lineTo(ML + UW, fy2 - 10); ctx.stroke();
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(ML, fy2 - 8); ctx.lineTo(ML + UW, fy2 - 8); ctx.stroke();
}

// ==================== EXPORTAR / IMPORTAR JSON ====================
function heExportarJSON() {
    const nome = document.getElementById('heNome')?.value || HIST_EDITOR.nomeAtual || 'modelo';
    HIST_EDITOR.modelo.nome = nome;
    const json = JSON.stringify(HIST_EDITOR.modelo, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `hist_modelo_${nome.replace(/[^a-z0-9]/gi,'_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function heImportarJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            HIST_EDITOR.modelo = data;
            HIST_EDITOR.nomeAtual = data.nome || '';
            const nomeEl = document.getElementById('heNome');
            if (nomeEl) nomeEl.value = data.nome || '';
            heTrocarAba('cabecalho');
            heGerarPreview();
            mostrarNotificacao?.('Modelo importado com sucesso!', 'success');
        } catch (err) {
            mostrarNotificacao?.('Erro ao ler o arquivo JSON.', 'error');
        }
    };
    reader.readAsText(file);
}

// ==================== SALVAR NA NUVEM ====================
async function heSalvarNuvem() {
    const token = localStorage.getItem('token');
    if (!token) { mostrarNotificacao?.('Faça login para salvar.', 'error'); return; }
    const nome = document.getElementById('heNome')?.value?.trim();
    if (!nome) { mostrarNotificacao?.('Informe o nome do modelo.', 'error'); return; }
    HIST_EDITOR.modelo.nome = nome;
    const payload = {
        nome,
        descricao: 'Modelo visual do histórico',
        tipo: 'historico-layout',
        config: HIST_EDITOR.modelo,
        uploads: HIST_UPLOADS || {}
    };
    const url = HIST_EDITOR.idAtual
        ? `${typeof API_URL !== 'undefined' ? API_URL : ''}/modelos/${HIST_EDITOR.idAtual}`
        : `${typeof API_URL !== 'undefined' ? API_URL : ''}/modelos`;
    const method = HIST_EDITOR.idAtual ? 'PUT' : 'POST';
    try {
        const resp = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (data.success) {
            HIST_EDITOR.idAtual = data.modelo?._id || HIST_EDITOR.idAtual;
            mostrarNotificacao?.(`Modelo "${nome}" salvo na nuvem!`, 'success');
            // Aplicar o modelo no config principal do histórico para geração do PDF
            _heAplicarModeloNaPrincipal();
            carregarModelosHist?.();
        } else {
            mostrarNotificacao?.(data.message || 'Erro ao salvar', 'error');
        }
    } catch (e) {
        mostrarNotificacao?.('Erro de conexão', 'error');
    }
}

// ==================== APLICAR MODELO NO SISTEMA PRINCIPAL ====================
function _heAplicarModeloNaPrincipal() {
    const m = HIST_EDITOR.modelo;
    if (!m) return;
    // Mapear campos do editor visual → configuração de histConfig
    const cfg = {
        cabecalho: {
            linha1: m.cabecalho?.linha1 || '',
            linha2: m.cabecalho?.linha2 || '',
            linha3: m.cabecalho?.linha3 || '',
            nomeInstituicao: m.cabecalho?.nomeInstituicao || '',
            endereco: m.cabecalho?.endereco || '',
            cnpj: m.cabecalho?.cnpj || '',
            inep: m.cabecalho?.inep || ''
        },
        frente: {
            resolucao: m.cabecalho?.resolucao || '',
            assinatura1: m.rodape?.assinatura1?.label || 'SECRETÁRIO(A)',
            assinatura2: m.rodape?.assinatura2?.label || 'DIRETOR(A)',
            localData: m.rodape?.localData || ''
        },
        emblema: {
            tipo: m.emblema?.tipo || 'brasao-brasil',
            largura: m.emblema?.largura || 22,
            altura: m.emblema?.altura || 26,
            qualidade: 100
        },
        layout: m.layout || {},
        tabela: m.tabela || {}
    };
    localStorage.setItem('histConfig', JSON.stringify(cfg));
    // Aplicar nos inputs visíveis se existirem
    if (typeof _aplicarConfigHistNosInputs === 'function') _aplicarConfigHistNosInputs(cfg);
}

// ==================== CARREGAR MODELO VISUAL PARA EDIÇÃO ====================
async function abrirEditorModeloHistoricoById(id) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const resp = await fetch(`${typeof API_URL !== 'undefined' ? API_URL : ''}/modelos/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (data.success) {
            const m = data.modelo;
            const config = m.config?.tabela ? m.config : null; // já é layout config
            const modelo = config || Object.assign(_histEditorModeloPadrao(), m.config || {});
            modelo.nome = m.nome;
            abrirEditorModeloHistorico({ ...modelo, _id: m._id });
        } else {
            mostrarNotificacao?.('Erro ao carregar modelo.', 'error');
        }
    } catch (e) {
        mostrarNotificacao?.('Erro de conexão', 'error');
    }
}

// ==================== BOTÃO NOVO MODELO VISUAL ====================
function abrirNovoModeloHistoricoVisual() {
    abrirEditorModeloHistorico(null);
}
