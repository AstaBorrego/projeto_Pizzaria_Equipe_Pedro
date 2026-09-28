// ==========================================
// BELLA MASSA - EXPEDIÇÃO E BALCÃO (TELA 5)
// ==========================================

let state = { orders: [], finalized: 0 };
let activeFilter = 'all';
let timerHandle;

// ==========================================
// 1. ALTERNÂNCIA DE TEMA
// ==========================================
function setTheme(mode) {
  const btnLight = document.getElementById('btnLight');
  const btnDark = document.getElementById('btnDark');

  if (mode === 'light') {
    document.body.classList.add('light-theme');
    localStorage.setItem('bellaMassa_theme', 'light');
    if (btnLight) btnLight.classList.add('active');
    if (btnDark) btnDark.classList.remove('active');
  } else {
    document.body.classList.remove('light-theme');
    localStorage.setItem('bellaMassa_theme', 'dark');
    if (btnDark) btnDark.classList.add('active');
    if (btnLight) btnLight.classList.remove('active');
  }
}
window.setTheme = setTheme;

// ==========================================
// 2. LEITURA CENTRALIZADA (TELA 4 -> TELA 5)
// ==========================================
function loadState() {
  let localPedidos = JSON.parse(localStorage.getItem('bellaMassa_pedidos') || '[]');
  
  // Captura os pedidos que acabaram de sair da Cozinha (Tela 4 envia como 'delivered')
  const expedicaoPedidos = localPedidos.filter(p => p.status === 'delivered');
  
  return {
    orders: expedicaoPedidos.map(p => {
      
      // SISTEMA INTELIGENTE DE IDENTIFICAÇÃO
      const tipoOriginal = String(p.tipo || p.mode || '').toLowerCase();
      let type = 'balcao'; 
      
      if (tipoOriginal.includes('salao') || tipoOriginal.includes('salão') || tipoOriginal.includes('mesa')) {
        type = 'salao';
      } else if (tipoOriginal.includes('entrega') || tipoOriginal.includes('delivery')) {
        type = 'delivery';
      }
      
      const isCalled = type === 'balcao' ? true : (p.called || false);
      
      let mins = 0;
      if (p.dataHora) {
        const diff = new Date().getTime() - new Date(p.dataHora).getTime();
        mins = Math.max(0, Math.floor(diff / 60000));
      }

      // CORREÇÃO DO NOME DO CLIENTE:
      // Se o sistema guardou o padrão "Cliente Balcão" da Tela 1, corrigimos visualmente de acordo com o tipo real.
      let nomeCliente = p.cliente || 'Cliente';
      if (nomeCliente === 'Cliente Balcão' || nomeCliente === 'Cliente') {
        if (type === 'salao') nomeCliente = 'Cliente Salão';
        else if (type === 'delivery') nomeCliente = 'Cliente Delivery';
      }

      return {
        id: p.id,
        mode: p.tipo || 'Balcão',
        type: type, 
        table: p.mesa || '01',
        status: 'ready', 
        created: p.dataHora ? new Date(p.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '--:--',
        mins: mins,
        customer: nomeCliente, // APLICA O NOME CORRIGIDO AQUI
        called: isCalled,
        calledAt: isCalled && !p.calledAt ? new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : (p.calledAt || null),
        waiterNotified: p.waiterNotified || false,
        items: Array.isArray(p.itens) 
          ? p.itens.map(i => [`${i.quantity || 1}x`, i.product || 'Item', i.size || ''])
          : Array.isArray(p.items) ? p.items : [['1x', 'Item', '']]
      };
    }),
    finalized: localPedidos.filter(p => p.status === 'finished').length
  };
}

function reloadDataAndRender() {
  state = loadState();
  render();
}

function padId(id) { return String(id).slice(-4); }

// Aplica filtros de pesquisa (Busca e Abas da Tela 5)
function visibleOrders() {
  const searchInput = document.getElementById('searchInput');
  const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
  return state.orders.filter(o => o.status === 'ready' && (activeFilter === 'all' || o.type === activeFilter) && (!q || `${o.id} ${o.customer || ''} ${o.mode}`.toLowerCase().includes(q)));
}

// ==========================================
// 3. RENDERIZAÇÃO DOS CARDS E ESTATÍSTICAS
// ==========================================
function renderOrder(order) {
  const tooOld = order.mins >= 15;
  let action = '';
  
  // Botões contextuais conforme a modalidade
  if (order.type === 'balcao') {
    action = `<button class="action done" data-action="deliver" data-id="${order.id}">✓ Entregar ao Cliente</button>`;
  } else if (order.type === 'salao') {
    action = order.waiterNotified
      ? `<button class="action done" data-action="deliver" data-id="${order.id}">✓ Entregue à mesa</button>`
      : `<button class="action waiter" data-action="waiter" data-id="${order.id}">🔔 Avisar garçom</button>`;
  } else {
    // AQUI: Alterado de "deliver" para "dispatch"
    action = `<button class="action done" data-action="dispatch" data-id="${order.id}">✓ Despachar Moto</button>`;
  }

  const items = (order.items || []).map(i => {
    const detail = i[2] !== 'N/A' && i[2] !== 'Selecione' ? i[2] : '';
    return `<div class="item"><span class="qty">${i[0]}</span><span>${i[1]} <small>${detail}</small></span></div>`;
  }).join('');
  
  const badgeClass = order.type === 'balcao' ? 'gold' : order.type === 'salao' ? 'green' : 'red';
  
  return `<article class="order-card ${tooOld ? 'priority' : ''}">
    <div class="order-top">
      <div class="order-number">#${padId(order.id)}</div>
      <div class="order-meta"><div class="badge ${badgeClass}">${order.mode}</div><div class="timer">◷ ${order.mins} min</div><div class="order-time">Criado às ${order.created}</div></div>
    </div>
    <div class="customer"><strong>${order.customer || 'Cliente'}</strong><small>${order.type === 'salao' ? 'Atendimento no salão' : order.type === 'balcao' ? 'Retirada no balcão' : 'Fluxo de delivery'}</small></div>
    <div class="items">${items}</div>
    <div class="order-state"><span class="status-text">${tooOld ? 'Atenção: tempo de espera alto' : 'Aguardando expedição'}</span><div class="actions">${action}</div></div>
  </article>`;
}

function render() {
  const orders = visibleOrders();
  const readyAll = state.orders.filter(o => o.status === 'ready');
  
  // Filtros para os painéis da direita
  const called = state.orders.filter(o => o.status === 'ready' && o.type === 'balcao' && o.called);
  const tables = state.orders.filter(o => o.status === 'ready' && o.type === 'salao');
  const oldest = readyAll.length ? Math.max(...readyAll.map(o => o.mins)) : 0;

  // Atualiza as listas
  const ordersListEl = document.getElementById('ordersList');
  if (ordersListEl) ordersListEl.innerHTML = orders.length ? orders.map(renderOrder).join('') : `<div class="empty">Nenhum pedido aguardando expedição.</div>`;
  
  // Atualiza as tags (badges) nos títulos
  if (document.getElementById('readyBadge')) document.getElementById('readyBadge').textContent = `${readyAll.length} ${readyAll.length === 1 ? 'pedido' : 'pedidos'}`;
  if (document.getElementById('tablesBadge')) document.getElementById('tablesBadge').textContent = tables.length;
  
  // Atualiza as estatísticas globais (caixas do topo) conforme a sua regra
  if (document.getElementById('statReady')) document.getElementById('statReady').textContent = readyAll.length; // Atualiza 'Prontos p/ Expedição' (Salão, Delivery e Balcão)
  if (document.getElementById('statCalled')) document.getElementById('statCalled').textContent = called.length; // Atualiza 'Aguardando Retirada' (Balcão)
  if (document.getElementById('statTables')) document.getElementById('statTables').textContent = tables.length; // Atualiza 'Mesas Aguardando' (Salão)
  
  if (document.getElementById('statOldest')) document.getElementById('statOldest').textContent = `${oldest} min`;
  if (document.getElementById('finalized')) document.getElementById('finalized').textContent = state.finalized;
  if (document.getElementById('callCount')) document.getElementById('callCount').textContent = called.length; 
  if (document.getElementById('lastUpdate')) document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('pt-BR',{hour12:false});

  // Renderiza as colunas da direita
  renderCalls(called);
  renderTables(tables);
  renderPublic(called);
  bindActions();
}

// Painel de Chamadas (Balcão)
function renderCalls(called){
  const el = document.getElementById('callsList');
  if (!el) return;
  el.innerHTML = called.length ? called.map(o => `<div class="call-row"><div class="call-left"><div class="call-number">#${padId(o.id)}</div><div><div class="call-name">${o.customer}</div><div class="call-time">Pronto às ${o.created || '--:--'}</div></div></div><button class="mini-action" data-action="deliver" data-id="${o.id}">Entregar</button></div>`).join('') : '<div class="empty">Nenhuma chamada aguardando.</div>';
}

// Painel de Mesas (Salão)
function renderTables(tables){
  const el = document.getElementById('tablesList');
  if (!el) return;
  
  el.innerHTML = tables.length ? tables.map(o => `
    <div class="table-row">
      <div class="table-left">
        <div class="table-chip">${o.table || '01'}</div>
        <div class="table-info">
          <strong>Pedido #${padId(o.id)}</strong>
          <span>${o.customer}</span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
        <span class="table-status" style="font-size: 0.75rem; color: ${o.waiterNotified ? 'var(--basil-green)' : 'var(--text-muted)'}">
          ${o.waiterNotified ? 'Garçom avisado' : 'Aguardando garçom'}
        </span>
        <button class="mini-action" data-action="deliver" data-id="${o.id}">✓ Retirado</button>
      </div>
    </div>
  `).join('') : '<div class="empty">Nenhuma mesa aguardando.</div>';
}

// Painel Público (Modal)
function renderPublic(called){
  const el = document.getElementById('publicList');
  if (!el) return;
  el.innerHTML = called.length ? called.map(o => `<div class="public-row"><strong>#${padId(o.id)}</strong><span>Pedido pronto — ${o.customer}</span></div>`).join('') : '<div class="empty">Nenhuma chamada ativa.</div>';
}

function bindActions() {
  document.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => handleAction(btn.dataset.action, Number(btn.dataset.id))));
}

// ==========================================
// 4. AÇÕES E INTERAÇÕES (ATUALIZA O BANCO CENTRAL)
// ==========================================
function handleAction(action, id) {
  let localPedidos = JSON.parse(localStorage.getItem('bellaMassa_pedidos') || '[]');
  let idx = localPedidos.findIndex(p => p.id === id);
  if (idx === -1) return;

  if (action === 'waiter') {
    localPedidos[idx].waiterNotified = true;
    showToast(`Garçom avisado sobre o pedido #${padId(id)}.`);
  } else if (action === 'deliver') {
    localPedidos[idx].status = 'finished'; 
    showToast(`Pedido #${padId(id)} entregue com sucesso.`);
  } else if (action === 'dispatch') {
    // AQUI: Cria o status que a Tela 6 vai ler
    localPedidos[idx].status = 'dispatched'; 
    showToast(`Moto despachada! Pedido #${padId(id)} transferido para Entregas.`);
  }
  
  localStorage.setItem('bellaMassa_pedidos', JSON.stringify(localPedidos));
  window.dispatchEvent(new Event('storage'));
  
  reloadDataAndRender();
}

function tick() {
  const now = new Date();
  const dateEl = document.getElementById('date');
  const clockEl = document.getElementById('clock');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('pt-BR');
  if (clockEl) clockEl.textContent = now.toLocaleTimeString('pt-BR',{hour12:false});
}

function showToast(message) {
  const toast = document.getElementById('toast'); 
  if (!toast) return;
  toast.textContent = message; 
  toast.classList.add('show'); 
  clearTimeout(timerHandle); 
  timerHandle = setTimeout(() => toast.classList.remove('show'), 2400);
}

// ==========================================
// 5. INICIALIZAÇÃO
// ==========================================
function setup() {
  const savedTheme = localStorage.getItem('bellaMassa_theme') || 'dark';
  setTheme(savedTheme);

  document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', () => { 
    document.querySelectorAll('.filter').forEach(b => b.classList.remove('active')); 
    btn.classList.add('active'); 
    activeFilter = btn.dataset.filter; 
    render(); 
  }));

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.addEventListener('input', render);

  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', () => { reloadDataAndRender(); showToast('Painel atualizado.'); });

  const publicPanelBtn = document.getElementById('publicPanelBtn');
  if (publicPanelBtn) publicPanelBtn.addEventListener('click', () => document.getElementById('publicModal').classList.remove('hidden'));

  const closeModal = document.getElementById('closeModal');
  if (closeModal) closeModal.addEventListener('click', () => document.getElementById('publicModal').classList.add('hidden'));

  const helpBtn = document.getElementById('helpBtn');
  if (helpBtn) helpBtn.addEventListener('click', () => document.getElementById('helpModal').classList.remove('hidden'));

  const closeHelp = document.getElementById('closeHelp');
  if (closeHelp) closeHelp.addEventListener('click', () => document.getElementById('helpModal').classList.add('hidden'));

  document.querySelectorAll('.modal-backdrop').forEach(m => m.addEventListener('click', e => { if(e.target === m) m.classList.add('hidden'); }));

  tick(); 
  setInterval(tick, 1000); 
  reloadDataAndRender();
}

// Escuta atualizações vindas da Cozinha (Tela 4) e Atendimento (Tela 1) em tempo real
window.addEventListener('storage', (e) => {
  if (e.key === 'bellaMassa_pedidos') {
    reloadDataAndRender();
    showToast("Novos pedidos chegaram na expedição!");
  }
});

document.addEventListener('DOMContentLoaded', setup);