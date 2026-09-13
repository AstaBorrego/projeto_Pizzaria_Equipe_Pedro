// Este trecho de escuta  que recebe os dados do cliente e preenche os campos
window.addEventListener('message', (event) => {
  // Verifica se a ação recebida é a de carregar cliente
  if (event.data && event.data.action === 'LOAD_CUSTOMER_DATA') {
    const cliente = event.data.customer;
    
    // Preenche os inputs do formulário de atendimento do Pedro
    if (document.getElementById('inputNome')) {
      document.getElementById('inputNome').value = cliente.nome;
    }
    if (document.getElementById('inputTelefone')) {
      document.getElementById('inputTelefone').value = cliente.telefone;
    }
  }
});
// fim



const DEMO_ORDERS = [
  { id: 12, mode: 'Balcão', type: 'balcao', status: 'ready', created: '20:11', mins: 3, customer: 'João', items: [['1x','Calabresa','Média']] },
  { id: 18, mode: 'Balcão', type: 'balcao', status: 'ready', created: '20:15', mins: 7, customer: 'Mariana', items: [['1x','Frango com Catupiry','Grande'],['1x','Guaraná','2L']] },
  { id: 19, mode: 'Mesa 03', type: 'salao', table: '03', status: 'ready', created: '20:18', mins: 4, customer: 'Mesa 03', items: [['1x','Quatro Queijos','Grande'],['1x','Borda Cheddar','Adicional']] },
  { id: 20, mode: 'Mesa 05', type: 'salao', table: '05', status: 'ready', created: '20:20', mins: 9, customer: 'Mesa 05', items: [['1x','Portuguesa','Grande']] },
  { id: 21, mode: 'Delivery', type: 'delivery', status: 'ready', created: '20:22', mins: 2, customer: 'Pedido delivery', items: [['1x','Marguerita','Grande']] }
];

const STORAGE_KEY = 'bella-massa-us005-state-v1';
let state = loadState();
let activeFilter = 'all';
let timerHandle;

function cloneDemo(){ return JSON.parse(JSON.stringify({orders:DEMO_ORDERS, finalized:0, calls:0})); }
function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : cloneDemo();
  } catch { return cloneDemo(); }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function padId(id){ return String(id).padStart(4,'0'); }

function visibleOrders(){
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
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

  const items = order.items.map(i => `<div class="item"><span class="qty">${i[0]}</span><span>${i[1]}<small>${i[2]}</small></span></div>`).join('');
  const badgeClass = order.type === 'balcao' ? 'gold' : order.type === 'salao' ? 'green' : 'red';
  return `<article class="order-card ${tooOld ? 'priority' : ''}">
    <div class="order-top">
      <div class="order-number">#${padId(order.id)}</div>
      <div class="order-meta"><div class="badge ${badgeClass}">${order.mode}</div><div class="timer">◷ ${order.mins} min</div><div class="order-time">Pronto às ${order.created}</div></div>
    </div>
    <div class="customer"><strong>${order.customer || 'Cliente não identificado'}</strong><small>${order.type === 'salao' ? 'Atendimento no salão' : order.type === 'balcao' ? 'Retirada no balcão' : 'Fluxo de delivery'}</small></div>
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

  document.getElementById('ordersList').innerHTML = orders.length ? orders.map(renderOrder).join('') : `<div class="empty">Nenhum pedido encontrado para este filtro.</div>`;
  document.getElementById('readyBadge').textContent = `${readyAll.length} ${readyAll.length === 1 ? 'pedido' : 'pedidos'}`;
  document.getElementById('tablesBadge').textContent = tables.length;
  document.getElementById('statReady').textContent = readyAll.length;
  document.getElementById('statCalled').textContent = called.length;
  document.getElementById('statTables').textContent = tables.length;
  document.getElementById('statOldest').textContent = `${oldest} min`;
  document.getElementById('finalized').textContent = state.finalized;
  document.getElementById('callCount').textContent = state.calls;
  document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('pt-BR',{hour12:false});

  renderCalls(called);
  renderTables(tables);
  renderPublic(called);
  bindActions();
}

function renderCalls(called){
  const el = document.getElementById('callsList');
  el.innerHTML = called.length ? called.map(o => `<div class="call-row"><div class="call-left"><div class="call-number">#${padId(o.id)}</div><div><div class="call-name">${o.customer}</div><div class="call-time">Chamado às ${o.calledAt || '--:--'}</div></div></div><button class="mini-action" data-action="deliver" data-id="${o.id}">Entregar</button></div>`).join('') : '<div class="empty">Nenhuma chamada aguardando retirada.</div>';
}
function renderTables(tables){
  const el = document.getElementById('tablesList');
  el.innerHTML = tables.length ? tables.map(o => `<div class="table-row"><div class="table-left"><div class="table-chip">${o.table}</div><div class="table-info"><strong>Pedido #${padId(o.id)}</strong><span>${o.customer}</span></div></div><span class="table-status">${o.waiterNotified ? 'Garçom avisado' : 'Aguardando garçom'}</span></div>`).join('') : '<div class="empty">Nenhuma mesa aguardando atendimento.</div>';
}
function renderPublic(called){
  document.getElementById('publicList').innerHTML = called.length ? called.map(o => `<div class="public-row"><strong>#${padId(o.id)}</strong><span>Pedido pronto — ${o.customer}</span></div>`).join('') : '<div class="empty">Nenhuma chamada ativa.</div>';
}
function bindActions(){
  document.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => handleAction(btn.dataset.action, Number(btn.dataset.id))));
}

function handleAction(action,id){
  const order = state.orders.find(o => o.id === id);
  if(!order) return;
  if(action === 'call' && order.type === 'balcao'){
    order.called = true; order.calledAt = new Date().toLocaleTimeString('pt-BR',{hour12:false}); state.calls++;
    showToast(`Senha #${padId(id)} chamada no painel público.`);
  } else if(action === 'waiter' && order.type === 'salao'){
    order.waiterNotified = true;
    showToast(`Garçom avisado sobre o pedido #${padId(id)}.`);
  } else if(action === 'deliver'){
    order.status = 'done'; state.finalized++;
    showToast(`Pedido #${padId(id)} marcado como entregue.`);
  }
  saveState(); render();
}

function tick(){
  const now = new Date();
  document.getElementById('date').textContent = now.toLocaleDateString('pt-BR');
  document.getElementById('clock').textContent = now.toLocaleTimeString('pt-BR',{hour12:false});
}
function showToast(message){
  const toast=document.getElementById('toast'); toast.textContent=message; toast.classList.add('show'); clearTimeout(timerHandle); timerHandle=setTimeout(()=>toast.classList.remove('show'),2400);
}
function resetDemo(){ state=cloneDemo(); saveState(); render(); showToast('Dados da demonstração restaurados.'); }

function setup(){
  document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', () => { document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); activeFilter=btn.dataset.filter; render(); }));
  document.getElementById('searchInput').addEventListener('input', render);
  document.getElementById('refreshBtn').addEventListener('click', () => { render(); showToast('Painel atualizado.'); });
  document.getElementById('resetBtn').addEventListener('click', resetDemo);
  document.getElementById('publicPanelBtn').addEventListener('click', () => document.getElementById('publicModal').classList.remove('hidden'));
  document.getElementById('closeModal').addEventListener('click', () => document.getElementById('publicModal').classList.add('hidden'));
  document.getElementById('helpBtn').addEventListener('click', () => document.getElementById('helpModal').classList.remove('hidden'));
  document.getElementById('closeHelp').addEventListener('click', () => document.getElementById('helpModal').classList.add('hidden'));
  document.querySelectorAll('.modal-backdrop').forEach(m => m.addEventListener('click', e => { if(e.target===m) m.classList.add('hidden'); }));
  document.getElementById('logoutBtn').addEventListener('click', () => showToast('Sessão encerrada (demonstração).'));
  tick(); setInterval(tick,1000); render();
}
setup();
