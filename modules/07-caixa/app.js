// ==========================================
// ESTADO GLOBAL DO CAIXA (BELLA MASSA)
// ==========================================
let caixaState = {
  saldoInicial: 100.00,
  reforcos: 0.00,
  saidas: 0.00,
  vendasPix: 0.00,
  vendasCredito: 0.00,
  vendasDebito: 0.00,
  vendasDinheiro: 0.00,
  movimentacoes: [],
  operacaoAtual: null,
  caixaAberto: true,
  // Acumuladores persistentes para o fechamento do turno atual
  totalReforcosTurno: 0.00,
  totalSangriasTurno: 0.00
};

let timerHandle;

// Formatar valor para Real (R$)
function money(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Máscara para formatar os campos de valor com vírgula em tempo real
function aplicarMascaraMoeda(input) {
  input.addEventListener('input', (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (!valor) {
      e.target.value = '';
      return;
    }
    valor = (Number(valor) / 100).toFixed(2) + '';
    valor = valor.replace('.', ',');
    valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    e.target.value = valor;
  });
}

// Leitura automática dos dados da Tela 1
function loadCaixaData() {
  let dbPedidos = [];
  if (typeof DB !== 'undefined') {
    dbPedidos = DB.getPedidos();
  } else {
    dbPedidos = JSON.parse(localStorage.getItem('bellaMassa_pedidos') || '[]');
  }

  if (dbPedidos && dbPedidos.length > 0) {
    if (!caixaState.caixaAberto) {
      caixaState.caixaAberto = true;
      atualizarInterfaceToggle();
      showToast("Novo pedido detetado: Caixa reaberto automaticamente!");
    }

    caixaState.vendasPix = 0.00;
    caixaState.vendasCredito = 0.00;
    caixaState.vendasDebito = 0.00;
    caixaState.vendasDinheiro = 0.00;
    
    dbPedidos.forEach(p => {
      const valorTotal = Number(p.total || p.valor || 0);
      const formaPagamento = String(p.formaPagamento || 'Pix').toLowerCase();
      
      let tipoVenda = 'vendasPix';
      let nomeForma = 'PIX';
      
      if (formaPagamento.includes('crédito') || formaPagamento.includes('credito')) {
        tipoVenda = 'vendasCredito';
        nomeForma = 'Cartão de Crédito';
      } else if (formaPagamento.includes('débito') || formaPagamento.includes('debito')) {
        tipoVenda = 'vendasDebito';
        nomeForma = 'Cartão de Débito';
      } else if (formaPagamento.includes('dinheiro')) {
        tipoVenda = 'vendasDinheiro';
        nomeForma = 'Dinheiro';
      }

      caixaState[tipoVenda] += valorTotal;
    });
  }

  renderCaixa();
}

// Atualizar Interface e Totais no Ecrã
function renderCaixa() {
  const totalVendas = caixaState.vendasPix + caixaState.vendasCredito + caixaState.vendasDebito + caixaState.vendasDinheiro;
  const totalEntradasVendasReforco = totalVendas + caixaState.reforcos;
  
  const saldoAtual = Math.max(100.00, caixaState.saldoInicial + totalEntradasVendasReforco - caixaState.saidas);

  if (document.getElementById('saldoInicial')) document.getElementById('saldoInicial').textContent = money(caixaState.saldoInicial);
  if (document.getElementById('totalEntradas')) document.getElementById('totalEntradas').textContent = money(totalEntradasVendasReforco);
  if (document.getElementById('totalSaidas')) document.getElementById('totalSaidas').textContent = money(caixaState.saidas);
  if (document.getElementById('saldoAtual')) document.getElementById('saldoAtual').textContent = money(saldoAtual);

  if (document.getElementById('totalPix')) document.getElementById('totalPix').textContent = money(caixaState.vendasPix);
  if (document.getElementById('totalCredito')) document.getElementById('totalCredito').textContent = money(caixaState.vendasCredito);
  if (document.getElementById('totalDebito')) document.getElementById('totalDebito').textContent = money(caixaState.vendasDebito);
  if (document.getElementById('totalDinheiro')) document.getElementById('totalDinheiro').textContent = money(caixaState.vendasDinheiro);

  if (document.getElementById('fechamentoVendas')) document.getElementById('fechamentoVendas').textContent = money(totalVendas);
  if (document.getElementById('fechamentoMovimentacoes')) document.getElementById('fechamentoMovimentacoes').textContent = money(caixaState.reforcos - caixaState.saidas);
  if (document.getElementById('valorEsperado')) document.getElementById('valorEsperado').textContent = money(saldoAtual);

  document.querySelectorAll('section').forEach(sec => {
    const textoSec = sec.innerHTML;
    if (textoSec.includes('Pedidos Aguardando Pagamento') || textoSec.includes('Histórico de Movimentações')) {
      sec.style.display = 'none';
    }
  });

  configurarBotaoToggle();
  ajustarBotoesTema();
}

// ==========================================
// CONFIGURAÇÃO DO BOTÃO TOGGLE (LIGA/DESLIGA)
// ==========================================
function configurarBotaoToggle() {
  let badge = document.getElementById('caixaStatusBadge');
  if (!badge) return;

  badge.style.cssText = `
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    padding: 4px;
    width: 155px;
    height: 36px;
    border-radius: 20px;
    position: relative;
    transition: background 0.3s ease;
    user-select: none;
    font-weight: bold;
    font-size: 0.85rem;
    color: white;
    background-color: ${caixaState.caixaAberto ? '#2ecc71' : '#e74c3c'};
  `;

  badge.innerHTML = `
    <span style="
      width: 28px;
      height: 28px;
      background: white;
      border-radius: 50%;
      position: absolute;
      top: 4px;
      left: ${caixaState.caixaAberto ? '123px' : '4px'};
      transition: left 0.3s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    "></span>
    <span style="width: 100%; text-align: ${caixaState.caixaAberto ? 'left' : 'right'}; padding: 0 10px; z-index: 1; white-space: nowrap;">
      ${caixaState.caixaAberto ? 'Caixa Aberto' : 'Caixa Fechado'}
    </span>
  `;

  badge.onclick = () => {
    caixaState.caixaAberto = !caixaState.caixaAberto;
    atualizarInterfaceToggle();
    showToast(caixaState.caixaAberto ? "Caixa aberto manualmente." : "Caixa fechado manualmente.");
  };
}

function atualizarInterfaceToggle() {
  configurarBotaoToggle();
}

function ajustarBotoesTema() {
  const btnLight = document.getElementById('btnLight');
  const btnDark = document.getElementById('btnDark');
  
  [btnLight, btnDark].forEach(btn => {
    if (btn) {
      btn.style.background = 'transparent';
      btn.style.border = 'none';
      btn.style.boxShadow = 'none';
    }
  });
}

// ==========================================
// CONTROLO DE MODAIS (MOVIMENTAÇÃO E FECHAMENTO)
// ==========================================
function abrirMovimentacao(tipo) {
  // REGRA: Impede novas operações se o caixa estiver fechado
  if (!caixaState.caixaAberto) {
    mostrarModalAviso("O caixa encontra-se fechado! Abra o caixa antes de realizar sangrias ou reforços.");
    return;
  }

  caixaState.operacaoAtual = tipo;
  const modal = document.getElementById('movementModal');
  const title = document.getElementById('movementTitle');
  const valInput = document.getElementById('movementValue');
  const reasonInput = document.getElementById('movementReason');

  if (!modal) return;

  if (tipo === 'sangria') {
    if (title) title.textContent = '💸 Registar Sangria (Retirada)';
  } else {
    if (title) title.textContent = '💰 Registar Reforço de Caixa';
  }

  if (valInput) {
    valInput.value = '';
    valInput.type = 'text';
    aplicarMascaraMoeda(valInput);
  }
  if (reasonInput) reasonInput.value = '';
  modal.classList.remove('hidden');
}

function fecharMovimentacao() {
  const modal = document.getElementById('movementModal');
  if (modal) modal.classList.add('hidden');
}

function confirmarMovimentacao() {
  if (!caixaState.caixaAberto) {
    fecharMovimentacao();
    mostrarModalAviso("Operação recusada. O caixa está fechado.");
    return;
  }

  const valInput = document.getElementById('movementValue');
  const reasonInput = document.getElementById('movementReason');
  
  if (!valInput || !reasonInput) return;

  const valorStr = valInput.value.trim();
  const motivoStr = reasonInput.value.trim();

  if (!valorStr || !motivoStr) {
    mostrarModalAviso("Preenchimento obrigatório! Por favor, informe tanto o valor quanto o motivo da operação.");
    return;
  }

  const valorNumerico = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));

  if (isNaN(valorNumerico) || valorNumerico <= 0) {
    mostrarModalAviso("Por favor, informe um valor válido maior que zero.");
    return;
  }

  const totalVendas = caixaState.vendasPix + caixaState.vendasCredito + caixaState.vendasDebito + caixaState.vendasDinheiro;
  const saldoAtual = caixaState.saldoInicial + caixaState.reforcos + totalVendas - caixaState.saidas;

  if (caixaState.operacaoAtual === 'sangria') {
    if ((saldoAtual - valorNumerico) < 100.00) {
      fecharMovimentacao();
      mostrarModalAviso(`Operação impossível! O saldo em caixa não pode ficar abaixo de R$ 100,00. O limite máximo permitido para sangria neste momento é de ${money(saldoAtual - 100.00)}.`);
      return;
    }

    caixaState.saidas += valorNumerico;
    caixaState.totalSangriasTurno += valorNumerico; // Acumula para exibição no modal
    showToast(`Sangria de ${money(valorNumerico)} registada com sucesso.`);
  } else {
    caixaState.reforcos += valorNumerico;
    caixaState.totalReforcosTurno += valorNumerico; // Acumula para exibição no modal
    showToast(`Reforço de ${money(valorNumerico)} adicionado ao caixa.`);
  }

  fecharMovimentacao();
  renderCaixa();
}

// Fechamento de Caixa com Apresentação Correta de Sangrias e Reforços
function fecharCaixa() {
  const totalVendas = caixaState.vendasPix + caixaState.vendasCredito + caixaState.vendasDebito + caixaState.vendasDinheiro;
  const saldoFinal = Math.max(100.00, caixaState.saldoInicial + caixaState.reforcos + totalVendas - caixaState.saidas);

  caixaState.caixaAberto = false;
  
  // Guarda os totais do turno antes de zerar para o próximo ciclo
  const reforcosTurnoExibir = caixaState.totalReforcosTurno;
  const sangriasTurnoExibir = caixaState.totalSangriasTurno;

  // Transfere o saldo final para o saldo inicial do próximo turno
  caixaState.saldoInicial = Math.max(100.00, saldoFinal);
  caixaState.reforcos = 0.00;
  caixaState.saidas = 0.00;
  caixaState.vendasPix = 0.00;
  caixaState.vendasCredito = 0.00;
  caixaState.vendasDebito = 0.00;
  caixaState.vendasDinheiro = 0.00;
  caixaState.totalReforcosTurno = 0.00;
  caixaState.totalSangriasTurno = 0.00;

  atualizarInterfaceToggle();
  renderCaixa();

  let modal = document.getElementById('fechamentoModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'fechamentoModal';
    modal.className = 'modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    modal.innerHTML = `
      <div class="modal-content" style="background: var(--card-bg, #1e1e1e); border: 1px solid var(--border-color, #333); padding: 25px; border-radius: 12px; text-align: center; max-width: 400px; width: 90%;">
        <h2 style="color: var(--cheese-gold, #f1c40f); margin-bottom: 12px; font-size: 1.25rem;">🔒 Caixa Fechado com Sucesso</h2>
        <div id="fechamentoModalContent" style="color: var(--text-light, #fff); font-size: 1rem; margin-bottom: 20px; line-height: 1.6; text-align: left; background: var(--card-header, #2a2a2a); padding: 15px; border-radius: 8px;"></div>
        <button type="button" class="btn-primary" onclick="document.getElementById('fechamentoModal').style.display='none';">OK</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const contentEl = document.getElementById('fechamentoModalContent');
  if (contentEl) {
    contentEl.innerHTML = `
      <p><strong>Total de Vendas:</strong> ${money(totalVendas)}</p>
      <p><strong>Reforços:</strong> ${money(reforcosTurnoExibir)}</p>
      <p><strong>Sangrias (Saídas):</strong> ${money(sangriasTurnoExibir)}</p>
      <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 10px 0;">
      <p style="font-size: 1.1rem; color: var(--basil-green);"><strong>Saldo transferido p/ Início:</strong> ${money(saldoFinal)}</p>
    `;
  }
  modal.style.display = 'flex';
}

// Modal unificado de avisos
function mostrarModalAviso(mensagem) {
  let modal = document.getElementById('avisoModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'avisoModal';
    modal.className = 'modal hidden';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    modal.innerHTML = `
      <div class="modal-content" style="background: var(--card-bg, #1e1e1e); border: 1px solid var(--border-color, #333); padding: 25px; border-radius: 12px; text-align: center; max-width: 400px; width: 90%;">
        <h2 style="color: var(--cheese-gold, #f1c40f); margin-bottom: 12px; font-size: 1.25rem;">⚠️ Aviso do Sistema</h2>
        <p id="avisoModalMessage" style="color: var(--text-light, #fff); font-size: 1rem; margin-bottom: 20px; line-height: 1.5;"></p>
        <button type="button" class="btn-primary" onclick="document.getElementById('avisoModal').style.display='none'; document.getElementById('avisoModal').classList.add('hidden');">OK</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  const msgEl = document.getElementById('avisoModalMessage');
  if (msgEl) msgEl.textContent = mensagem;
  modal.style.display = 'flex';
  modal.classList.remove('hidden');
}

// Notificações Toast
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// Gestão de Tema
function setTheme(mode) {
  if (mode === 'light') {
    document.body.classList.add('light-theme');
    localStorage.setItem('bellaMassa_theme', 'light');
    document.getElementById('btnLight')?.classList.add('active');
    document.getElementById('btnDark')?.classList.remove('active');
  } else {
    document.body.classList.remove('light-theme');
    localStorage.setItem('bellaMassa_theme', 'dark');
    document.getElementById('btnDark')?.classList.add('active');
    document.getElementById('btnLight')?.classList.remove('active');
  }
  ajustarBotoesTema();
}
window.setTheme = setTheme;

// Sincronização em tempo real
window.addEventListener('storage', (e) => {
  if (e.key === 'bellaMassa_pedidos') {
    loadCaixaData();
  }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('bellaMassa_theme') || 'dark';
  setTheme(savedTheme);
  loadCaixaData();
  configurarBotaoToggle();
  ajustarBotoesTema();
});

// Exposição global das funções necessárias
window.abrirMovimentacao = abrirMovimentacao;
window.fecharMovimentacao = fecharMovimentacao;
window.confirmarMovimentacao = confirmarMovimentacao;
window.fecharCaixa = fecharCaixa;