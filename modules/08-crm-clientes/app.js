// ==========================================
// ESTADO GLOBAL DO CAIXA (AUTOMATIZADO)
// ==========================================
let caixaState = {
  saldoInicial: 100.00,
  entradas: 0.00,
  saidas: 0.00,
  vendasPix: 0.00,
  vendasCredito: 0.00,
  vendasDebito: 0.00,
  vendasDinheiro: 0.00,
  pedidosProcessados: [],
  movimentacoes: []
};

// Formatar valor para Real (R$)
function money(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Leitura automática e processamento direto dos dados da Tela 1
function loadCaixaData() {
  let dbPedidos = [];
  if (typeof DB !== 'undefined') {
    dbPedidos = DB.getPedidos();
  } else {
    dbPedidos = JSON.parse(localStorage.getItem('bellaMassa_pedidos') || '[]');
  }

  if (dbPedidos && dbPedidos.length > 0) {
    caixaState.entradas = 0.00;
    caixaState.vendasPix = 0.00;
    caixaState.vendasCredito = 0.00;
    caixaState.vendasDebito = 0.00;
    caixaState.vendasDinheiro = 0.00;
    caixaState.pedidosProcessados = [];
    caixaState.movimentacoes = [];

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

      caixaState.entradas += valorTotal;
      caixaState[tipoVenda] += valorTotal;

      const horaPedido = p.dataHora ? new Date(p.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '---';
      caixaState.movimentacoes.push({
        hora: horaPedido,
        tipo: 'Entrada (Venda)',
        descricao: `Pedido #${String(p.id).slice(-4)} (${nomeForma})`,
        valor: valorTotal,
        fluxo: 'entrada'
      });

      caixaState.pedidosProcessados.push({
        id: p.id,
        cliente: p.cliente || 'Cliente',
        modalidade: p.tipo || 'Balcão',
        total: valorTotal,
        formaPagamento: nomeForma,
        status: 'Pago'
      });
    });
  }

  renderCaixa();
}

// Atualizar Interface e Totais no Ecrã
function renderCaixa() {
  const saldoAtual = caixaState.saldoInicial + caixaState.entradas - caixaState.saidas;
  
  if (document.getElementById('statSaldoInicial')) document.getElementById('statSaldoInicial').textContent = money(caixaState.saldoInicial);
  if (document.getElementById('statEntradas')) document.getElementById('statEntradas').textContent = money(caixaState.entradas);
  if (document.getElementById('statSaidas')) document.getElementById('statSaidas').textContent = money(caixaState.saidas);
  if (document.getElementById('statSaldoAtual')) document.getElementById('statSaldoAtual').textContent = money(saldoAtual);

  if (document.getElementById('totalPix')) document.getElementById('totalPix').textContent = money(caixaState.vendasPix);
  if (document.getElementById('totalCredito')) document.getElementById('totalCredito').textContent = money(caixaState.vendasCredito);
  if (document.getElementById('totalDebito')) document.getElementById('totalDebito').textContent = money(caixaState.vendasDebito);
  if (document.getElementById('totalDinheiro')) document.getElementById('totalDinheiro').textContent = money(caixaState.vendasDinheiro);

  const tbody = document.getElementById('paymentOrdersBody');
  const emptyState = document.getElementById('emptyPaymentOrders');
  if (tbody) {
    tbody.innerHTML = '';
    if (caixaState.pedidosProcessados.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
    } else {
      if (emptyState) emptyState.classList.add('hidden');
      caixaState.pedidosProcessados.forEach(pedido => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span class="order-id">#${String(pedido.id).slice(-4)}</span></td>
          <td><strong>${pedido.cliente}</strong></td>
          <td>${pedido.modalidade}</td>
          <td><strong>${money(pedido.total)}</strong></td>
          <td><span class="status delivered" style="color: var(--basil-green);">${pedido.status} (${pedido.formaPagamento})</span></td>
          <td><span style="font-size: 0.85rem; color: var(--text-muted);">Registado</span></td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  renderHistoricoMovimentacoes();
}

// Renderizar Histórico de Movimentações
function renderHistoricoMovimentacoes() {
  const historicoContainer = document.getElementById('historicoMovimentacoesBody') || document.getElementById('movimentacoesList') || document.getElementById('paymentHistoryBody');
  if (!historicoContainer) return;

  historicoContainer.innerHTML = caixaState.movimentacoes.length === 0 
    ? '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Nenhuma movimentação registada.</td></tr>' 
    : caixaState.movimentacoes.map(m => `
        <tr>
          <td>${m.hora}</td>
          <td>${m.tipo}</td>
          <td>${m.descricao}</td>
          <td style="color: ${m.fluxo === 'entrada' ? 'var(--basil-green)' : 'var(--pizza-red)'}; font-weight: bold;">
            ${m.fluxo === 'entrada' ? '+' : '-'} ${money(m.valor)}
          </td>
        </tr>
      `).join('');
}

// ==========================================
// RENDERIZAÇÃO INLINE DE SANGRIA E REFORÇO
// ==========================================
function injetarFormulariosInline() {
  const botoesAcao = document.querySelectorAll('.action-box, .action-card, button.action-btn');
  
  botoesAcao.forEach((box, index) => {
    if (index === 0 && !document.getElementById('formSangriaInline')) {
      const container = document.createElement('div');
      container.id = 'formSangriaInline';
      container.className = 'inline-action-form hidden';
      container.style.cssText = 'margin-top: 15px; padding: 15px; background: var(--card-header); border: 1px solid var(--border-color); border-radius: 10px;';
      container.innerHTML = `
        <h3 style="color: var(--cheese-gold); font-size: 1.1rem; margin-bottom: 10px;">Registar Sangria (Retirada)</h3>
        <div style="margin-bottom: 10px;">
          <label style="display: block; font-size: 0.9rem; margin-bottom: 5px;">Valor da Sangria (R$):</label>
          <input type="number" id="inputValorSangria" step="0.50" placeholder="Ex: 50.00" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-light);">
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" onclick="executarSangriaInline()" style="flex: 1; background: var(--pizza-red); border: none; padding: 8px; border-radius: 6px; color: white; font-weight: bold; cursor: pointer;">Confirmar</button>
          <button class="btn btn-secondary" onclick="alternarFormulario('sangria')" style="flex: 1; background: var(--border-color); border: none; padding: 8px; border-radius: 6px; color: var(--text-light); font-weight: bold; cursor: pointer;">Cancelar</button>
        </div>
      `;
      box.appendChild(container);
    } else if (index === 1 && !document.getElementById('formReforcoInline')) {
      const container = document.createElement('div');
      container.id = 'formReforcoInline';
      container.className = 'inline-action-form hidden';
      container.style.cssText = 'margin-top: 15px; padding: 15px; background: var(--card-header); border: 1px solid var(--border-color); border-radius: 10px;';
      container.innerHTML = `
        <h3 style="color: var(--cheese-gold); font-size: 1.1rem; margin-bottom: 10px;">Registar Reforço de Caixa</h3>
        <div style="margin-bottom: 10px;">
          <label style="display: block; font-size: 0.9rem; margin-bottom: 5px;">Valor do Suprimento (R$):</label>
          <input type="number" id="inputValorReforco" step="0.50" placeholder="Ex: 100.00" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-light);">
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" onclick="executarReforcoInline()" style="flex: 1; background: var(--basil-green); border: none; padding: 8px; border-radius: 6px; color: white; font-weight: bold; cursor: pointer;">Confirmar</button>
          <button class="btn btn-secondary" onclick="alternarFormulario('reforco')" style="flex: 1; background: var(--border-color); border: none; padding: 8px; border-radius: 6px; color: var(--text-light); font-weight: bold; cursor: pointer;">Cancelar</button>
        </div>
      `;
      box.appendChild(container);
    }
  });
}

function alternarFormulario(tipo) {
  if (tipo === 'sangria') {
    const f = document.getElementById('formSangriaInline');
    if (f) f.classList.toggle('hidden');
  } else if (tipo === 'reforco') {
    const f = document.getElementById('formReforcoInline');
    if (f) f.classList.toggle('hidden');
  }
}

// Executar Sangria Inline
function executarSangriaInline() {
  const input = document.getElementById('inputValorSangria');
  if (!input) return;
  const valor = parseFloat(input.value.replace(',', '.'));

  if (isNaN(valor) || valor <= 0) {
    mostrarModalSucesso("Por favor, informe um valor válido.");
    return;
  }

  const saldoAtual = caixaState.saldoInicial + caixaState.entradas - caixaState.saidas;
  
  if ((saldoAtual - valor) < 100.00) {
    mostrarModalSucesso(`Operação negada! O saldo em caixa não pode ficar abaixo de R$ 100,00 (Limite máximo para sangria: ${money(saldoAtual - 100.00)}).`);
    return;
  }

  caixaState.saidas += valor;
  caixaState.movimentacoes.unshift({
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    tipo: 'Saída (Sangria)',
    descricao: 'Retirada de numerário',
    valor: valor,
    fluxo: 'saida'
  });

  input.value = '';
  alternarFormulario('sangria');
  renderCaixa();
  mostrarModalSucesso(`Sangria de ${money(valor)} registada com sucesso.`);
}

// Executar Reforço Inline
function executarReforcoInline() {
  const input = document.getElementById('inputValorReforco');
  if (!input) return;
  const valor = parseFloat(input.value.replace(',', '.'));

  if (isNaN(valor) || valor <= 0) {
    mostrarModalSucesso("Por favor, informe um valor válido.");
    return;
  }

  caixaState.saldoInicial += valor;
  caixaState.movimentacoes.unshift({
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    tipo: 'Entrada (Reforço)',
    descricao: 'Suprimento de caixa',
    valor: valor,
    fluxo: 'entrada'
  });

  input.value = '';
  alternarFormulario('reforco');
  renderCaixa();
  mostrarModalSucesso(`Reforço de ${money(valor)} adicionado ao caixa.`);
}

// Gestão de Modais de Mensagens
function mostrarModalSucesso(mensagem) {
  const modal = document.getElementById('successModal');
  const msgEl = document.getElementById('successModalMessage');
  if (msgEl) msgEl.textContent = mensagem;
  if (modal) modal.classList.remove('hidden');
}

function fecharModalSucesso() {
  const modal = document.getElementById('successModal');
  if (modal) modal.classList.add('hidden');
}

// Tema Claro / Escuro
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
}
window.setTheme = setTheme;

// Sincronização automática em tempo real via storage
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
  injetarFormulariosInline();

  // Vincula os botões principais de Ação Rápida para alternar os formulários inline
  const botoesAcao = document.querySelectorAll('.action-box button, button.action-btn');
  if (botoesAcao.length >= 2) {
    botoesAcao[0].setAttribute('onclick', "alternarFormulario('sangria')");
    botoesAcao[1].setAttribute('onclick', "alternarFormulario('reforco')");
  }
});