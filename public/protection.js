/**
 * ===============================================
 * GERADOR DE CERTIFICADOS PROFISSIONAL
 * ===============================================
 * 
 * PROPRIETÁRIO / AUTOR ORIGINAL:
 * Wander Pires Silva Coelho
 * E-mail: wanderpsc@gmail.com
 * 
 * © 2026 Wander Pires Silva Coelho - Todos os Direitos Reservados
 * Registro de Propriedade Intelectual - Software Proprietário
 * 
 * AVISO DE COPYRIGHT E PROPRIEDADE INTELECTUAL
 * 
 * Este software é PROPRIEDADE EXCLUSIVA de Wander Pires Silva Coelho
 * e está protegido por:
 * - Lei de Direitos Autorais (Lei 9.610/98)
 * - Lei de Software (Lei 9.609/98)
 * - Código Penal Art. 184 (Violação de Direito Autoral)
 * - Tratados internacionais de propriedade intelectual (Convenção de Berna)
 * - DMCA (Digital Millennium Copyright Act) para proteção internacional
 * 
 * PROIBIÇÕES LEGAIS:
 * ✗ Cópia, reprodução, modificação ou distribuição não autorizada
 * ✗ Engenharia reversa, descompilação ou desmontagem
 * ✗ Remoção ou alteração de avisos de copyright e proteções
 * ✗ Sublicenciamento, revenda ou redistribuição
 * ✗ Uso para criar produtos derivados ou concorrentes
 * ✗ Extração de código-fonte via DevTools, console ou scrapers
 * 
 * CONSEQUÊNCIAS LEGAIS:
 * O uso não autorizado deste software constitui CRIME
 * previsto nos Art. 184 do Código Penal e Lei 9.609/98, sujeito a:
 * - Detenção de 6 meses a 2 anos (Art. 184 §1º CP)
 * - Reclusão de 2 a 4 anos para fins comerciais (Art. 184 §2º CP)
 * - Ação civil por danos materiais e morais
 * - Multas e indenizações
 * - Apreensão de equipamentos
 * 
 * RASTREAMENTO E IDENTIFICAÇÃO:
 * Este software possui sistemas de rastreamento,
 * fingerprinting e identificação de uso não autorizado.
 * Todas as tentativas de acesso indevido são registradas.
 * 
 * CONTATO DO PROPRIETÁRIO:
 * Wander Pires Silva Coelho
 * Email: wanderpsc@gmail.com
 * 
 * ===============================================
 */

// Proteção total contra cópia, console e engenharia reversa
(function() {
    'use strict';

    // ========== BLOQUEIO TOTAL DO CONSOLE ==========
    // Salvar referências originais antes de neutralizar
    const _origWarn = console.warn.bind(console);

    // Função vazia para substituir todos os métodos do console
    const _bloqueado = function() {
        return undefined;
    };

    // Exibir aviso de segurança uma vez antes de bloquear
    _origWarn('%c⛔ CONSOLE BLOQUEADO — SOFTWARE PROTEGIDO', 'color:red;font-size:22px;font-weight:bold;');
    _origWarn('%c© 2026 Wander Pires Silva Coelho — Todos os Direitos Reservados', 'color:red;font-size:14px;');
    _origWarn('%cTentativas de cópia ou engenharia reversa são registradas e constituem CRIME.', 'color:#b91c1c;font-size:13px;');
    _origWarn('%cLei 9.610/98 • Lei 9.609/98 • Art. 184 CP • DMCA', 'color:#6b7280;font-size:11px;');

    // Neutralizar TODOS os métodos do console
    const metodos = ['log','warn','error','info','debug','dir','dirxml','table',
        'trace','group','groupCollapsed','groupEnd','clear','count','countReset',
        'assert','profile','profileEnd','time','timeLog','timeEnd','timeStamp'];
    
    metodos.forEach(function(m) {
        try { console[m] = _bloqueado; } catch(e) {}
    });

    // Tornar o console não-configurável para impedir restauração
    try {
        Object.defineProperty(window, 'console', {
            value: console,
            writable: false,
            configurable: false
        });
    } catch(e) {}

    // ========== ANTI-DEBUGGING AVANÇADO ==========
    // Armadilha de debugger contínua
    (function _trap() {
        try {
            (function() { return false; }
                ['constructor']('debugger')
                ['call']());
        } catch(e) {}
        setTimeout(_trap, 2000);
    })();

    // Detectar DevTools por tamanho da janela
    const _threshold = 160;
    let _devtoolsAberto = false;

    setInterval(function() {
        const w = window.outerWidth - window.innerWidth > _threshold;
        const h = window.outerHeight - window.innerHeight > _threshold;
        if ((w || h) && !_devtoolsAberto) {
            _devtoolsAberto = true;
            document.title = '⛔ ACESSO NÃO AUTORIZADO — Software Protegido';
        } else if (!w && !h) {
            _devtoolsAberto = false;
        }
    }, 1500);

    // Detectar DevTools via toString (técnica do getter)
    const _el = new Image();
    Object.defineProperty(_el, 'id', {
        get: function() {
            _devtoolsAberto = true;
            document.title = '⛔ DevTools Detectado — Software Protegido por Lei';
        }
    });

    // ========== BLOQUEIO DE TECLAS E MOUSE ==========
    // Desabilitar clique direito
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, true);

    // Desabilitar atalhos de desenvolvedor e cópia
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault(); e.stopPropagation(); return false;
        }
        // Ctrl+Shift+I/J/C (DevTools)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' ||
            e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
            e.preventDefault(); e.stopPropagation(); return false;
        }
        // Ctrl+U (ver código-fonte)
        if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
            e.preventDefault(); e.stopPropagation(); return false;
        }
        // Ctrl+S (salvar página)
        if (e.ctrlKey && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
            e.preventDefault(); e.stopPropagation(); return false;
        }
        // Ctrl+A (selecionar tudo) — apenas fora de inputs
        if (e.ctrlKey && (e.key === 'A' || e.key === 'a' || e.keyCode === 65)) {
            var tag = (e.target || e.srcElement).tagName;
            if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
                e.preventDefault(); e.stopPropagation(); return false;
            }
        }
        // Ctrl+C — permitir somente dentro de inputs/textareas
        if (e.ctrlKey && (e.key === 'C' || e.key === 'c') && !e.shiftKey) {
            var tag2 = (e.target || e.srcElement).tagName;
            if (tag2 !== 'INPUT' && tag2 !== 'TEXTAREA') {
                e.preventDefault(); e.stopPropagation(); return false;
            }
        }
        // Ctrl+P (imprimir página)
        if (e.ctrlKey && (e.key === 'P' || e.key === 'p' || e.keyCode === 80)) {
            e.preventDefault(); e.stopPropagation(); return false;
        }
    }, true);

    // Bloquear arrastar conteúdo
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    }, true);

    // Bloquear seleção de texto (exceto inputs)
    document.addEventListener('selectstart', function(e) {
        var tag = (e.target || e.srcElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
            e.preventDefault();
            return false;
        }
    }, true);

    // ========== PROTEÇÃO CONTRA IFRAME / EMBEDDING ==========
    if (window.self !== window.top) {
        window.top.location = window.self.location;
    }

    // ========== PROTEÇÃO CONTRA CÓPIA VIA CLIPBOARD ==========
    document.addEventListener('copy', function(e) {
        var tag = (e.target || e.srcElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
            e.preventDefault();
            if (e.clipboardData) {
                e.clipboardData.setData('text/plain',
                    '⛔ Conteúdo protegido por direitos autorais. © 2026 Wander Pires Silva Coelho. Cópia não autorizada.');
            }
            return false;
        }
    }, true);

    // ========== FINGERPRINT DE SESSÃO ==========
    var _fp = {
        ts: Date.now(),
        ua: navigator.userAgent,
        lang: navigator.language,
        plat: navigator.platform,
        screen: screen.width + 'x' + screen.height,
        owner: 'Wander Pires Silva Coelho <wanderpsc@gmail.com>'
    };
    try {
        Object.defineProperty(window, '__APP_FP__', {
            value: Object.freeze(_fp),
            writable: false,
            configurable: false,
            enumerable: false
        });
    } catch(e) {}

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
        -webkit-user-select: none;
    `;
    watermark.textContent = '© 2026 Wander Pires Silva Coelho — Software Proprietário';
    document.body.appendChild(watermark);

    // CSS anti-seleção global (exceto inputs)
    const style = document.createElement('style');
    style.textContent = `
        body, html, div, span, p, h1, h2, h3, h4, h5, h6, a, td, th, li, label, button {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
        }
        input, textarea, [contenteditable="true"] {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            user-select: text !important;
        }
    `;
    document.head.appendChild(style);
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
