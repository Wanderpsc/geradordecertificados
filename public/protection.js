/**
 * ===============================================
 * GERADOR DE CERTIFICADOS PROFISSIONAL
 * ===============================================
 * 
 * © 2026 - Todos os Direitos Reservados
 * 
 * AVISO DE COPYRIGHT E PROPRIEDADE INTELECTUAL
 * 
 * Este software é PROPRIEDADE PRIVADA e está protegido por:
 * - Lei de Direitos Autorais (Lei 9.610/98)
 * - Lei de Software (Lei 9.609/98)
 * - Tratados internacionais de propriedade intelectual
 * 
 * PROIBIÇÕES LEGAIS:
 * ✗ Cópia, modificação ou distribuição não autorizada
 * ✗ Engenharia reversa ou descompilação
 * ✗ Remoção de avisos de copyright
 * ✗ Sublicenciamento ou revenda
 * ✗ Uso para criar produtos concorrentes
 * 
 * CONSEQUÊNCIAS LEGAIS:
 * O uso não autorizado deste software constitui CRIME
 * previsto em lei, sujeitotoa:
 * - Ação civil por danos materiais e morais
 * - Processo criminal por violação de direitos autorais
 * - Multas e indenizações
 * - Apreensão de equipamentos
 * 
 * RASTREAMENTO:
 * Este software possui sistemas de rastreamento e
 * identificação de uso não autorizado.
 * 
 * LICENCIAMENTO:
 * Para adquirir uma licença legítima, entre em contato:
 * Email: licencas@geradorcertificados.com.br
 * Site: www.geradorcertificados.com.br
 * 
 * ===============================================
 */

// Verificação de integridade do código
(function() {
    'use strict';
    
    // Anti-debugging
    const devtools = {
        isOpen: false,
        orientation: null
    };
    
    const threshold = 160;
    
    const emitEvent = (state) => {
        if (state !== devtools.isOpen) {
            devtools.isOpen = state;
            if (state) {
                console.warn('%c⚠️ AVISO DE SEGURANÇA', 'color: red; font-size: 20px; font-weight: bold;');
                console.warn('%c© 2026 Gerador de Certificados - SOFTWARE PROTEGIDO', 'color: red; font-size: 16px;');
                console.warn('%cEste software é protegido por direitos autorais.', 'color: orange; font-size: 14px;');
                console.warn('%cO uso não autorizado é CRIME previsto em lei.', 'color: orange; font-size: 14px;');
                console.warn('%cLei 9.610/98 (Direitos Autorais) | Lei 9.609/98 (Software)', 'color: gray; font-size: 12px;');
            }
        }
    };
    
    // Detectar abertura do DevTools
    setInterval(() => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            emitEvent(true);
        }
    }, 1000);
    
    // Desabilitar clique direito
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        console.warn('⚠️ Clique direito desabilitado - Software Protegido');
        return false;
    });
    
    // Desabilitar atalhos de desenvolvedor
    document.addEventListener('keydown', (e) => {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'U')) {
            e.preventDefault();
            console.warn('⚠️ Atalho bloqueado - Software Protegido por Copyright');
            return false;
        }
    });
    
    // Watermark de copyright
    console.log('%c© 2026 GERADOR DE CERTIFICADOS PROFISSIONAL', 
        'color: #1e3a8a; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);');
    console.log('%cTodos os Direitos Reservados - Software Proprietário', 
        'color: #3b82f6; font-size: 16px;');
    console.log('%c⚖️ Protegido por Lei 9.610/98 e Lei 9.609/98', 
        'color: #6b7280; font-size: 12px;');
    console.log('%c🔒 Sistema com rastreamento anti-plágio ativo', 
        'color: #059669; font-size: 12px;');
})();

// Marca d'água no documento
function adicionarMarcaDagua() {
    const watermark = document.createElement('div');
    watermark.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        font-size: 10px;
        color: rgba(0, 0, 0, 0.1);
        pointer-events: none;
        z-index: 9999;
        user-select: none;
    `;
    watermark.textContent = '© 2026 Gerador de Certificados Profissional - Licença: ' + 
        (localStorage.getItem('licenca') ? JSON.parse(localStorage.getItem('licenca')).tipo : 'TRIAL');
    document.body.appendChild(watermark);
}

// Verificação de licença
function verificarLicenca() {
    const token = localStorage.getItem('token');
    const licenca = localStorage.getItem('licenca');
    
    if (!token || !licenca) {
        console.warn('⚠️ Licença não encontrada. Acesso restrito.');
        return false;
    }
    
    const licencaObj = JSON.parse(licenca);
    const dataExpiracao = new Date(licencaObj.dataExpiracao);
    const agora = new Date();
    
    if (agora > dataExpiracao) {
        console.warn('⚠️ Licença expirada. Renovação necessária.');
        return false;
    }
    
    return true;
}

// Inicializar proteções quando o DOM carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        adicionarMarcaDagua();
        verificarLicenca();
    });
} else {
    adicionarMarcaDagua();
    verificarLicenca();
}

// Proteção contra modificação do código
Object.freeze(Object.prototype);
Object.freeze(Array.prototype);
Object.freeze(Function.prototype);

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        verificarLicenca,
        adicionarMarcaDagua
    };
}
