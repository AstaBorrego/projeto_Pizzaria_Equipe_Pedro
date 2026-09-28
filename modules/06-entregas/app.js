// Escuta de dados de clientes (Integração CRM / postMessage)
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

const defaultRiders = [
  { id: 1, name: 'Carlos Silva', vehicle: 'Honda CG 160', plate: 'ABC1D23' },
  { id: 2, name: 'Rafael Santos', vehicle: 'Yamaha Factor 150', plate: 'DEF4G56' },
  { id: 3, name: 'Bruno Oliveira', vehicle: 'Honda Biz 125', plate: 'GHI7J89' }
];

let orders = [];
let riders = defaultRiders;

// ==========================================
// 1. LEITURA DO BANCO DE DADOS CENTRAL (READ)
// ==========================================
function loadData() {
  let dbPedidos = [];
  if (typeof DB !== 'undefined' && typeof DB.getPedidos === 'function') {
    dbPedidos = DB.getPedidos();
  } else {
    dbPedidos = JSON.parse(localStorage.getItem('bellaMassa_pedidos') || '[]');
  }

  // Filtrar apenas pedidos com modalidade de Entrega (aceitando variações de texto)
  const deliveryPedidos = dbPedidos.filter(p => {
    const tipo = String(p.tipo || '').toLowerCase();
    const modalidade = String(p.modalidade || '').toLowerCase();
    return tipo.includes('entrega') || tipo.includes('delivery') || modalidade.includes('entrega') || modalidade.includes('delivery');
  });

  orders = deliveryPedidos.map(p => {
    let statusDelivery = 'Aguardando motoboy';
    
    // CORREÇÃO: O pedido só assume status de rota/entregue se tiver um motoboy atribuído.
    // Isso impede que status gerados por outras telas (ex: Cozinha) burlem a etapa de atribuição.
    if (p.status === 'transit' || p.status === 'delivered') {
      if (p.motoboyId) {
        statusDelivery = 'Entregue';
      } else {
        statusDelivery = 'Aguardando motoboy'; // Trava de segurança
      }
    }
    
    // Status 'archived' ou 'finished' significa que já foi limpo da tela
    if (p.status === 'archived' || p.status === 'finished') {
      statusDelivery = 'Finalizado';
    }

    // CORREÇÃO VISUAL DO NOME DO CLIENTE
    let nomeCliente = p.cliente || 'Cliente';
    if (nomeCliente === 'Cliente Balcão' || nomeCliente === 'Cliente') {
      nomeCliente = 'Cliente Delivery';
    }

    return {
      id: p.id,
      customer: nomeCliente,
      address: p.endereco || 'Endereço não informado',
      fee: p.taxaEntrega || 7.00,
      status: statusDelivery,
      riderId: p.motoboyId || null,
      routeNote: p.orientacaoRota || ''
    };
  });

  // Salvar/Carregar Motoboys do Storage local
  const savedRiders = localStorage.getItem('bellaMassa_motoboys');
  if (savedRiders) {
    try { riders = JSON.parse(savedRiders); } catch(e) {}
  } else {
    localStorage.setItem('bellaMassa_motoboys', JSON.stringify(defaultRiders));
  }
}

function saveData() {
  localStorage.setItem('bellaMassa_motoboys', JSON.stringify(riders));
}

function money(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getRider(id) {
  return riders.find(r => r.id === Number(id));
}

// Verifica se o motoboy tem uma entrega ativa (sai da lista)
function isRiderBusy(id) {
  return orders.some(o => o.riderId === id && o.status === 'Entregue');
}

// ==========================================
// 2. FUNÇÕES VISUAIS E COMPONENTES
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

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 2600);
}

function renderStats() {
  const waiting = orders.filter(o => o.status === 'Aguardando motoboy').length;
  // Considera tanto Entregue quanto Finalizado para o fecho de taxas
  const deliveredOrders = orders.filter(o => o.status === 'Entregue' || o.status === 'Finalizado');
  const fees = deliveredOrders.reduce((sum, o) => sum + Number(o.fee), 0);

  if (document.getElementById('statWaiting')) document.getElementById('statWaiting').textContent = waiting;
  if (document.getElementById('statTransit')) document.getElementById('statTransit').textContent = '0'; // Desativado neste fluxo
  if (document.getElementById('statDelivered')) document.getElementById('statDelivered').textContent = deliveredOrders.length;
  if (document.getElementById('statFees')) document.getElementById('statFees').textContent = money(fees);
}

function statusClass(status) {
  if (status === 'Entregue') return 'delivered';
  return 'waiting';
}

function renderOrders() {
  const tbody = document.getElementById('ordersBody');
  const empty = document.getElementById('emptyOrders');
  const filterEl = document.getElementById('statusFilter');
  if (!tbody || !empty || !filterEl) return;

  const filter = filterEl.value;
  // Oculta os "Finalizados" para desaparecerem da tabela
  const activeOrders = orders.filter(o => o.status !== 'Finalizado');
  const list = filter === 'Todos' ? activeOrders : activeOrders.filter(o => o.status === filter);

  tbody.innerHTML = '';
  empty.classList.toggle('hidden', list.length !== 0);

  list.forEach(order => {
    const rider = order.riderId ? getRider(order.riderId) : null;
    const tr = document.createElement('tr');
    let actions = '';

    if (order.status === 'Aguardando motoboy') {
      actions = `<button class="btn btn-primary btn-small" onclick="openAssignModal(${order.id})">Atribuir</button>`;
    } else if (order.status === 'Entregue') {
      actions = `<button class="btn-success btn-small" onclick="clearOrder(${order.id})" style="background: var(--basil-green); border: none;">✓ Liberar Motoboy</button>`;
    }

    tr.innerHTML = `
      <td><span class="order-id">#${String(order.id).slice(-4)}</span></td>
      <td><strong>${order.customer}</strong><span class="address">${order.address}</span></td>
      <td>${rider ? rider.name : '<span style="color:var(--text-muted)">Não atribuído</span>'}</td>
      <td><span class="fee">${money(Number(order.fee))}</span></td>
      <td><span class="status ${statusClass(order.status)}">${order.status}</span></td>
      <td><div class="action-group">${actions}</div></td>`;
    tbody.appendChild(tr);
  });
}

function renderRiders() {
  const list = document.getElementById('ridersList');
  if (!list) return;
  list.innerHTML = '';

  // Filtra apenas os motoboys que NÃO estão ocupados
  const availableRiders = riders.filter(r => !isRiderBusy(r.id));

  if (availableRiders.length === 0) {
    list.innerHTML = '<p class="empty" style="padding: 15px; color: var(--text-muted); text-align: center; width: 100%;">Nenhum motoboy disponível. Todos estão em rota.</p>';
    return;
  }

  availableRiders.forEach(rider => {
    const card = document.createElement('div');
    card.className = 'rider-card';
    card.innerHTML = `
      <div class="rider-main">
        <div class="rider-avatar">🛵</div>
        <div>
          <div class="rider-name">${rider.name}</div>
          <div class="rider-meta">${rider.vehicle} • ${rider.plate}</div>
        </div>
      </div>
      <span class="availability free">Disponível</span>`;
    list.appendChild(card);
  });
}

function renderClosing() {
  const wrap = document.getElementById('closingCards');
  if (!wrap) return;
  wrap.innerHTML = '';

  riders.forEach(rider => {
    const delivered = orders.filter(o => (o.status === 'Entregue' || o.status === 'Finalizado') && o.riderId === rider.id);
    const amount = delivered.reduce((sum, o) => sum + Number(o.fee), 0);
    const card = document.createElement('div');
    card.className = 'closing-card';
    card.innerHTML = `
      <div class="closing-card-top">
        <div><h4>${rider.name}</h4><p>${delivered.length} entrega(s) concluída(s)</p></div>
        <span class="amount">${money(amount)}</span>
      </div>
      <p>${delivered.length ? `Pedidos: ${delivered.map(o => '#' + String(o.id).slice(-4)).join(', ')}` : 'Nenhuma taxa lançada para este motoboy.'}</p>`;
    wrap.appendChild(card);
  });
}

function renderAll() {
  renderStats();
  renderOrders();
  renderRiders();
  renderClosing();
}

// ==========================================
// 3. AÇÕES (ATRIBUIR E LIBERAR)
// ==========================================
function populateAssignment(preselectedOrderId) {
  const orderSelect = document.getElementById('orderSelect');
  const riderSelect = document.getElementById('riderSelect');
  if (!orderSelect || !riderSelect) return;

  const waiting = orders.filter(o => o.status === 'Aguardando motoboy');
  const available = riders.filter(r => !isRiderBusy(r.id));

  orderSelect.innerHTML = waiting.length
    ? waiting.map(o => `<option value="${o.id}">#${String(o.id).slice(-4)} - ${o.customer}</option>`).join('')
    : '<option value="">Nenhum pedido aguardando</option>';

  riderSelect.innerHTML = available.length
    ? available.map(r => `<option value="${r.id}">${r.name} - ${r.vehicle}</option>`).join('')
    : '<option value="">Nenhum motoboy disponível</option>';

  if (preselectedOrderId && waiting.some(o => o.id === preselectedOrderId)) {
    orderSelect.value = String(preselectedOrderId);
  }
  updateRoutePreview();
}

function updateRoutePreview() {
  const orderSelect = document.getElementById('orderSelect');
  const preview = document.getElementById('routePreview');
  if (!orderSelect || !preview) return;

  const id = Number(orderSelect.value);
  const order = orders.find(o => o.id === id);
  
  preview.innerHTML = order
    ? `<strong>Destino:</strong> ${order.address}<br><strong>Cliente:</strong> ${order.customer}<br><strong>Taxa:</strong> ${money(Number(order.fee))}`
    : 'Selecione um pedido para visualizar os dados da rota.';
}

function openAssignModal(orderId) {
  populateAssignment(orderId);
  const routeNote = document.getElementById('routeNote');
  if (routeNote) routeNote.value = '';
  const assignModal = document.getElementById('assignModal');
  if (assignModal) assignModal.classList.remove('hidden');
}

function closeAssignModal() {
  const assignModal = document.getElementById('assignModal');
  if (assignModal) assignModal.classList.add('hidden');
}

function assignDelivery() {
  const orderSelect = document.getElementById('orderSelect');
  const riderSelect = document.getElementById('riderSelect');
  if (!orderSelect || !riderSelect) return;

  const orderId = Number(orderSelect.value);
  const riderId = Number(riderSelect.value);
  const order = orders.find(o => o.id === orderId && o.status === 'Aguardando motoboy');
  const rider = getRider(riderId);

  if (!order) return alert('Selecione um pedido aguardando motoboy.');
  if (!rider || isRiderBusy(riderId)) return alert('Selecione um motoboy disponível.');

  const routeNote = document.getElementById('routeNote');
  const orientacao = routeNote ? routeNote.value.trim() : '';

  // Atualiza diretamente para "delivered" (Entregue)
  if (typeof DB !== 'undefined' && typeof DB.getPedidoPorId === 'function') {
    const pedidoDB = DB.getPedidoPorId(orderId);
    if (pedidoDB) {
      pedidoDB.status = 'delivered';
      pedidoDB.motoboyId = riderId;
      pedidoDB.orientacaoRota = orientacao;
      DB.salvarPedido(pedidoDB);
    }
  } else {
    let dbPedidos = JSON.parse(localStorage.getItem('bellaMassa_pedidos') || '[]');
    const idx = dbPedidos.findIndex(p => p.id === orderId);
    if (idx !== -1) {
      dbPedidos[idx].status = 'delivered';
      dbPedidos[idx].motoboyId = riderId;
      dbPedidos[idx].orientacaoRota = orientacao;
      localStorage.setItem('bellaMassa_pedidos', JSON.stringify(dbPedidos));
      window.dispatchEvent(new Event('storage'));
    }
  }

  saveData();
  closeAssignModal();
  loadData();
  renderAll();
  showToast(`Pedido atribuído. Taxa adicionada a ${rider.name}.`);
}

// Apaga o pedido da tabela visual e libera o motoboy (status: archived)
function clearOrder(orderId) {
  if (typeof DB !== 'undefined' && typeof DB.atualizarStatusPedido === 'function') {
    DB.atualizarStatusPedido(orderId, 'archived');
  } else {
    let dbPedidos = JSON.parse(localStorage.getItem('bellaMassa_pedidos') || '[]');
    const idx = dbPedidos.findIndex(p => p.id === orderId);
    if (idx !== -1) {
      dbPedidos[idx].status = 'archived';
      localStorage.setItem('bellaMassa_pedidos', JSON.stringify(dbPedidos));
      window.dispatchEvent(new Event('storage'));
    }
  }
  loadData();
  renderAll();
  showToast(`Pedido limpo do ecrã. Motoboy disponível novamente!`);
}

function closeShift() {
  const pending = orders.filter(o => o.status === 'Entregue').length;
  if (pending > 0) {
    alert(`Ainda existem ${pending} motoboy(s) em rota. Liberte-os antes de fechar o turno.`);
    return;
  }

  const delivered = orders.filter(o => o.status === 'Finalizado');
  const total = delivered.reduce((sum, o) => sum + Number(o.fee), 0);
  const detail = riders.map(r => {
    const riderOrders = delivered.filter(o => o.riderId === r.id);
    const riderTotal = riderOrders.reduce((sum, o) => sum + Number(o.fee), 0);
    return `${r.name}: ${riderOrders.length} entrega(s) - ${money(riderTotal)}`;
  }).join('\n');

  alert(`Fecho do turno\n\n${detail}\n\nTotal de taxas: ${money(total)}`);
}

// Globalização das funções
window.renderOrders = renderOrders;
window.openAssignModal = openAssignModal;
window.closeAssignModal = closeAssignModal;
window.assignDelivery = assignDelivery;
window.clearOrder = clearOrder; // Substitui as funções antigas
window.closeShift = closeShift;

// ==========================================
// 4. INICIALIZAÇÃO E EVENTOS
// ==========================================
window.addEventListener('db:pedidosUpdated', () => {
  loadData();
  renderAll();
});
window.addEventListener('db:externalChange', (e) => {
  if (e.detail && e.detail.key === 'bellaMassa_pedidos') {
    loadData();
    renderAll();
  }
});
window.addEventListener('storage', (e) => {
  if (e.key === 'bellaMassa_pedidos') {
    loadData();
    renderAll();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setTheme(localStorage.getItem('bellaMassa_theme') || 'dark');
  renderAll();

  const orderSelect = document.getElementById('orderSelect');
  if (orderSelect) orderSelect.addEventListener('change', updateRoutePreview);

  const assignModal = document.getElementById('assignModal');
  if (assignModal) {
    assignModal.addEventListener('click', e => {
      if (e.target.id === 'assignModal') closeAssignModal();
    });
  }
});