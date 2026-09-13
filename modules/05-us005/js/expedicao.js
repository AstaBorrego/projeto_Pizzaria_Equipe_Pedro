const STORAGE_KEY = 'bella-massa-us005-state-v1';
let state = loadState();
let activeFilter = 'all';
let timerHandle;

// ==========================================
// 1. ALTERNÂNCIA DE TEMA (CLAREAR / ESCURECER)
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

// Listener para postMessage
window.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'LOAD_CUSTOMER_DATA') {
    const cliente = event.data.customer;
    if (document.getElementById('inputNome')) {
      document.getElementById('inputNome').value = cliente.nome || cliente.name || '';
    }
    if (document.getElementById('inputTelefone')) {
      document.getElementById('inputTelefone').value = cliente.telefone || cliente.phone || '';
    }
  }
});

// ==========================================
// 2. LEITURA VIA BANCO CENTRALIZADO (DB)
// ==========================================
function loadState() {
  try {
    let localPedidos = [];
    if (typeof DB !== 'undefined') {
      localPedidos = DB.getPedidos();
    } else {
      localPedidos = JSON.parse(localStorage.getItem('bellaMassa_pedidos') || '[]');
    }

    if (localPedidos.length > 0) {
      const expedicaoPedidos = localPedidos.filter(p => p.status === 'ready');
      return {
        orders: expedicaoPedidos.map(p => ({
          id: p.id,
          mode: p.tipo || 'Balcão',
          type: (p.tipo === 'Salao' ? 'salao' : p.tipo === 'Entrega' ? 'delivery' : 'balcao'),
          table: p.mesa || '01',
          status: 'ready',
          created: p.dataHora ? new Date(p.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '20:00',
          mins: 5,
          customer: p.cliente || 'Cliente',
          items: Array.isArray(p.itens) 
            ? p.itens.map(i => [`${i.quantity || 1}x`, i.product || 'Item', i.size || ''])
            : Array.isArray(p.items) ? p.items : [['1x', 'Pizza', '']]
        })),
        finalized: localPedidos.filter(p => p.status === 'finished' || p.status === 'delivered').length,
        calls: 0
      };
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { orders: [], finalized: 0, calls: 0 };
  } catch {
    return { orders: [], finalized: 0, calls: 0 };
  }
}

function reloadDataAndRender() {
  state = loadState();
  render();
}

function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function padId(id){ return String(id).slice(-4); }

function visibleOrders(){
  const searchInput = document.getElementById('searchInput');
  const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
  return state.orders.filter(o => o.status === 'ready' && (activeFilter === 'all' || o.type === activeFilter) && (!q || `${o.id} ${o.customer || ''} ${o.mode}`.toLowerCase().includes(q)));
}

function renderOrder(order){
  const tooOld = order.mins >= 8;
  let action = '';
  if(order.type === 'balcao') action = order.called
    ? `<button class="action done" data-action="deliver" data-id="${order.id}">✓ Entregar</button>`
    : `<button class="action call" data-action="call" data-id="${order.id}">📣 Chamar cliente</button>`;
  else if(order.type === 'salao') action = order.waiterNotified
    ? `<button class="action done" data-action="deliver" data-id="${order.id}">✓ Entregar à mesa</button>`
    : `<button class="action waiter" data-action="waiter" data-id="${order.id}">🔔 Avisar garçom</button>`;
  else action = `<button class="action done" data-action="deliver" data-id="${order.id}">✓ Finalizar expedição</button>`;

  const items = (order.items || []).map(i => `<div class="item"><span class="qty">${i[0]}</span><span>${i[1]} <small>${i[2] || ''}</small></span></div>`).join('');
  const badgeClass = order.type === 'balcao' ? 'gold' : order.type === 'salao' ? 'green' : 'red';
  return `<article class="order-card ${tooOld ? 'priority' : ''}">
    <div class="order-top">
      <div class="order-number">#${padId(order.id)}</div>
      <div class="order-meta"><div class="badge ${badgeClass}">${order.mode}</div><div class="timer">◷ ${order.mins} min</div><div class="order-time">Pronto às ${order.created}</div></div>
    </div>
    <div class="customer"><strong>${order.customer || 'Cliente'}</strong><small>${order.type === 'salao' ? 'Atendimento no salão' : order.type === 'balcao' ? 'Retirada no balcão' : 'Fluxo de delivery'}</small></div>
    <div class="items">${items}</div>
    <div class="order-state"><span class="status-text">${tooOld ? 'Atenção: tempo de espera alto' : 'Aguardando expedição'}</span><div class="actions">${action}</div></div>
  </article>`;
}

function render(){
  const orders = visibleOrders();
  const readyAll = state.orders.filter(o => o.status === 'ready');
  const called = state.orders.filter(o => o.status === 'ready' && o.type === 'balcao' && o.called);
  const tables = state.orders.filter(o => o.status === 'ready' && o.type === 'salao');
  const oldest = readyAll.length ? Math.max(...readyAll.map(o => o.mins)) : 0;

  const ordersListEl = document.getElementById('ordersList');
  if (ordersListEl) ordersListEl.innerHTML = orders.length ? orders.map(renderOrder).join('') : `<div class="empty">Nenhum pedido encontrado para este filtro.</div>`;
  
  if (document.getElementById('readyBadge')) document.getElementById('readyBadge').textContent = `${readyAll.length} ${readyAll.length === 1 ? 'pedido' : 'pedidos'}`;
  if (document.getElementById('tablesBadge')) document.getElementById('tablesBadge').textContent = tables.length;
  if (document.getElementById('statReady')) document.getElementById('statReady').textContent = readyAll.length;
  if (document.getElementById('statCalled')) document.getElementById('statCalled').textContent = called.length;
  if (document.getElementById('statTables')) document.getElementById('statTables').textContent = tables.length;
  if (document.getElementById('statOldest')) document.getElementById('statOldest').textContent = `${oldest} min`;
  if (document.getElementById('finalized')) document.getElementById('finalized').textContent = state.finalized;
  if (document.getElementById('callCount')) document.getElementById('callCount').textContent = state.calls;
  if (document.getElementById('lastUpdate')) document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('pt-BR',{hour12:false});

  renderCalls(called);
  renderTables(tables);
  renderPublic(called);
  bindActions();
}

function renderCalls(called){
  const el = document.getElementById('callsList');
  if (!el) return;
  el.innerHTML = called.length ? called.map(o => `<div class="call-row"><div class="call-left"><div class="call-number">#${padId(o.id)}</div><div><div class="call-name">${o.customer}</div><div class="call-time">Chamado às ${o.calledAt || '--:--'}</div></div></div><button class="mini-action" data-action="deliver" data-id="${o.id}">Entregar</button></div>`).join('') : '<div class="empty">Nenhuma chamada aguardando retirada.</div>';
}

function renderTables(tables){
  const el = document.getElementById('tablesList');
  if (!el) return;
  el.innerHTML = tables.length ? tables.map(o => `<div class="table-row"><div class="table-left"><div class="table-chip">${o.table || '01'}</div><div class="table-info"><strong>Pedido #${padId(o.id)}</strong><span>${o.customer}</span></div></div><span class="table-status">${o.waiterNotified ? 'Garçom avisado' : 'Aguardando garçom'}</span></div>`).join('') : '<div class="empty">Nenhuma mesa aguardando atendimento.</div>';
}

function renderPublic(called){
  const el = document.getElementById('publicList');
  if (!el) return;
  el.innerHTML = called.length ? called.map(o => `<div class="public-row"><strong>#${padId(o.id)}</strong><span>Pedido pronto — ${o.customer}</span></div>`).join('') : '<div class="empty">Nenhuma chamada ativa.</div>';
}

function bindActions(){
  document.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => handleAction(btn.dataset.action, Number(btn.dataset.id))));
}

// ATUALIZAÇÃO NO BANCO CENTRALIZADO (UPDATE)
function handleAction(action, id){
  const order = state.orders.find(o => o.id === id);
  if(!order) return;
  if(action === 'call' && order.type === 'balcao'){
    order.called = true; order.calledAt = new Date().toLocaleTimeString('pt-BR',{hour12:false}); state.calls++;
    showToast(`Senha #${padId(id)} chamada no painel público.`);
  } else if(action === 'waiter' && order.type === 'salao'){
    order.waiterNotified = true;
    showToast(`Garçom avisado sobre o pedido #${padId(id)}.`);
  } else if(action === 'deliver'){
    order.status = 'done'; 
    state.finalized++;
    
    // Atualiza status no banco central DB
    if (typeof DB !== 'undefined') {
      DB.atualizarStatusPedido(id, 'finished');
    } else {
      let localPedidos = JSON.parse(localStorage.getItem('bellaMassa_pedidos') || '[]');
      let idx = localPedidos.findIndex(p => p.id === id);
      if (idx !== -1) {
        localPedidos[idx].status = 'finished';
        localStorage.setItem('bellaMassa_pedidos', JSON.stringify(localPedidos));
      }
    }
    showToast(`Pedido #${padId(id)} marcado como entregue.`);
  }
  saveState(); 
  reloadDataAndRender();
}

function tick(){
  const now = new Date();
  const dateEl = document.getElementById('date');
  const clockEl = document.getElementById('clock');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('pt-BR');
  if (clockEl) clockEl.textContent = now.toLocaleTimeString('pt-BR',{hour12:false});
}

function showToast(message){
  const toast = document.getElementById('toast'); 
  if (!toast) return;
  toast.textContent = message; 
  toast.classList.add('show'); 
  clearTimeout(timerHandle); 
  timerHandle = setTimeout(() => toast.classList.remove('show'), 2400);
}

function setup(){
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

// Escuta atualizações no banco de dados central em tempo real
window.addEventListener('db:pedidosUpdated', reloadDataAndRender);
window.addEventListener('db:externalChange', (e) => {
  if (e.detail && e.detail.key === 'bellaMassa_pedidos') {
    reloadDataAndRender();
  }
});

document.addEventListener('DOMContentLoaded', setup);