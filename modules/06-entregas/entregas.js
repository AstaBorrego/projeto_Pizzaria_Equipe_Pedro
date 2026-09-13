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

const STORAGE_KEY = 'bellaMassa_delivery_lucas006';

const defaultRiders = [
  { id: 1, name: 'Carlos Silva', vehicle: 'Honda CG 160', plate: 'ABC1D23' },
  { id: 2, name: 'Rafael Santos', vehicle: 'Yamaha Factor 150', plate: 'DEF4G56' },
  { id: 3, name: 'Bruno Oliveira', vehicle: 'Honda Biz 125', plate: 'GHI7J89' }
];

const defaultOrders = [
  { id: 1042, customer: 'Mariana Souza', address: 'Rua das Flores, 128 - Centro', fee: 8.00, status: 'Aguardando motoboy', riderId: null, routeNote: '' },
  { id: 1043, customer: 'João Lima', address: 'Av. Brasil, 950 - Jardim Maia', fee: 10.00, status: 'Aguardando motoboy', riderId: null, routeNote: '' },
  { id: 1044, customer: 'Fernanda Alves', address: 'Rua Sete de Setembro, 315 - Vila Galvão', fee: 9.50, status: 'Em trânsito', riderId: 1, routeNote: 'Priorizar a avenida principal' },
  { id: 1045, customer: 'Paulo Mendes', address: 'Av. Tiradentes, 1840 - Macedo', fee: 12.00, status: 'Entregue', riderId: 2, routeNote: '' },
  { id: 1046, customer: 'Ana Costa', address: 'Rua Dona Tecla, 77 - Jardim Flor da Montanha', fee: 11.50, status: 'Entregue', riderId: 3, routeNote: '' }
];

let orders = [];
let riders = [];

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      orders = Array.isArray(parsed.orders) ? parsed.orders : [...defaultOrders];
      riders = Array.isArray(parsed.riders) ? parsed.riders : [...defaultRiders];
    } catch {
      orders = JSON.parse(JSON.stringify(defaultOrders));
      riders = JSON.parse(JSON.stringify(defaultRiders));
    }
  } else {
    orders = JSON.parse(JSON.stringify(defaultOrders));
    riders = JSON.parse(JSON.stringify(defaultRiders));
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ orders, riders }));
}

function money(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getRider(id) {
  return riders.find(r => r.id === Number(id));
}

function isRiderBusy(id) {
  return orders.some(o => o.riderId === id && o.status === 'Em trânsito');
}

function setTheme(mode) {
  document.body.classList.toggle('light-theme', mode === 'light');
  localStorage.setItem('bellaMassa_theme', mode);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 2600);
}

function renderStats() {
  const waiting = orders.filter(o => o.status === 'Aguardando motoboy').length;
  const transit = orders.filter(o => o.status === 'Em trânsito').length;
  const delivered = orders.filter(o => o.status === 'Entregue').length;
  const fees = orders.filter(o => o.status === 'Entregue').reduce((sum, o) => sum + Number(o.fee), 0);

  document.getElementById('statWaiting').textContent = waiting;
  document.getElementById('statTransit').textContent = transit;
  document.getElementById('statDelivered').textContent = delivered;
  document.getElementById('statFees').textContent = money(fees);
}

function statusClass(status) {
  if (status === 'Em trânsito') return 'transit';
  if (status === 'Entregue') return 'delivered';
  return 'waiting';
}

function renderOrders() {
  const tbody = document.getElementById('ordersBody');
  const empty = document.getElementById('emptyOrders');
  const filter = document.getElementById('statusFilter').value;
  const list = filter === 'Todos' ? orders : orders.filter(o => o.status === filter);

  tbody.innerHTML = '';
  empty.classList.toggle('hidden', list.length !== 0);

  list.forEach(order => {
    const rider = order.riderId ? getRider(order.riderId) : null;
    const tr = document.createElement('tr');
    let actions = '';

    if (order.status === 'Aguardando motoboy') {
      actions = `<button class="btn btn-primary btn-small" onclick="openAssignModal(${order.id})">Atribuir</button>`;
    } else if (order.status === 'Em trânsito') {
      actions = `<button class="btn-success" onclick="markDelivered(${order.id})">Confirmar entrega</button>`;
    } else {
      actions = `<button class="btn btn-secondary btn-small" onclick="reopenOrder(${order.id})">Reabrir</button>`;
    }

    tr.innerHTML = `
      <td><span class="order-id">#${order.id}</span></td>
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
  list.innerHTML = '';

  riders.forEach(rider => {
    const busy = isRiderBusy(rider.id);
    const current = orders.find(o => o.riderId === rider.id && o.status === 'Em trânsito');
    const card = document.createElement('div');
    card.className = 'rider-card';
    card.innerHTML = `
      <div class="rider-main">
        <div class="rider-avatar">🛵</div>
        <div>
          <div class="rider-name">${rider.name}</div>
          <div class="rider-meta">${rider.vehicle} • ${rider.plate}${current ? ` • Pedido #${current.id}` : ''}</div>
        </div>
      </div>
      <span class="availability ${busy ? 'busy' : 'free'}">${busy ? 'Em rota' : 'Disponível'}</span>`;
    list.appendChild(card);
  });
}

function renderClosing() {
  const wrap = document.getElementById('closingCards');
  wrap.innerHTML = '';

  riders.forEach(rider => {
    const delivered = orders.filter(o => o.status === 'Entregue' && o.riderId === rider.id);
    const amount = delivered.reduce((sum, o) => sum + Number(o.fee), 0);
    const card = document.createElement('div');
    card.className = 'closing-card';
    card.innerHTML = `
      <div class="closing-card-top">
        <div><h4>${rider.name}</h4><p>${delivered.length} entrega(s) concluída(s)</p></div>
        <span class="amount">${money(amount)}</span>
      </div>
      <p>${delivered.length ? `Pedidos: ${delivered.map(o => '#' + o.id).join(', ')}` : 'Nenhuma taxa lançada para este motoboy.'}</p>`;
    wrap.appendChild(card);
  });
}

function renderAll() {
  renderStats();
  renderOrders();
  renderRiders();
  renderClosing();
}

function populateAssignment(preselectedOrderId) {
  const orderSelect = document.getElementById('orderSelect');
  const riderSelect = document.getElementById('riderSelect');
  const waiting = orders.filter(o => o.status === 'Aguardando motoboy');
  const available = riders.filter(r => !isRiderBusy(r.id));

  orderSelect.innerHTML = waiting.length
    ? waiting.map(o => `<option value="${o.id}">#${o.id} - ${o.customer}</option>`).join('')
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
  const id = Number(document.getElementById('orderSelect').value);
  const order = orders.find(o => o.id === id);
  const preview = document.getElementById('routePreview');
  preview.innerHTML = order
    ? `<strong>Destino:</strong> ${order.address}<br><strong>Cliente:</strong> ${order.customer}<br><strong>Taxa:</strong> ${money(Number(order.fee))}`
    : 'Selecione um pedido para visualizar os dados da rota.';
}

function openAssignModal(orderId) {
  populateAssignment(orderId);
  document.getElementById('routeNote').value = '';
  document.getElementById('assignModal').classList.remove('hidden');
}

function closeAssignModal() {
  document.getElementById('assignModal').classList.add('hidden');
}

function assignDelivery() {
  const orderId = Number(document.getElementById('orderSelect').value);
  const riderId = Number(document.getElementById('riderSelect').value);
  const order = orders.find(o => o.id === orderId && o.status === 'Aguardando motoboy');
  const rider = getRider(riderId);

  if (!order) return alert('Selecione um pedido aguardando motoboy.');
  if (!rider || isRiderBusy(riderId)) return alert('Selecione um motoboy disponível.');

  order.riderId = riderId;
  order.status = 'Em trânsito';
  order.routeNote = document.getElementById('routeNote').value.trim();
  saveData();
  closeAssignModal();
  renderAll();
  showToast(`Pedido #${order.id} atribuído a ${rider.name}.`);
}

function markDelivered(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order || order.status !== 'Em trânsito') return;
  order.status = 'Entregue';
  saveData();
  renderAll();
  showToast(`Entrega #${order.id} concluída e taxa lançada.`);
}

function reopenOrder(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = 'Aguardando motoboy';
  order.riderId = null;
  order.routeNote = '';
  saveData();
  renderAll();
  showToast(`Pedido #${order.id} voltou para a fila de entrega.`);
}

function closeShift() {
  const inTransit = orders.filter(o => o.status === 'Em trânsito').length;
  if (inTransit > 0) {
    alert(`Ainda existem ${inTransit} entrega(s) em trânsito. Finalize-as antes de fechar o turno.`);
    return;
  }

  const delivered = orders.filter(o => o.status === 'Entregue');
  const total = delivered.reduce((sum, o) => sum + Number(o.fee), 0);
  const detail = riders.map(r => {
    const riderOrders = delivered.filter(o => o.riderId === r.id);
    const riderTotal = riderOrders.reduce((sum, o) => sum + Number(o.fee), 0);
    return `${r.name}: ${riderOrders.length} entrega(s) - ${money(riderTotal)}`;
  }).join('\n');

  alert(`Fechamento do turno\n\n${detail}\n\nTotal de taxas: ${money(total)}`);
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setTheme(localStorage.getItem('bellaMassa_theme') || 'dark');
  renderAll();
  document.getElementById('orderSelect').addEventListener('change', updateRoutePreview);

  document.getElementById('assignModal').addEventListener('click', e => {
    if (e.target.id === 'assignModal') closeAssignModal();
  });
});
