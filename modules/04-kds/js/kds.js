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

const orders = [
  { id: 15, mode: 'Delivery', modeClass: 'red', status: 'queue', created: '20:02', mins: 12, items: [['1x','Calabresa Especial','Grande'],['1x','Refrigerante Coca-Cola','2L'],['1x','Pão de Alho','Tradicional']] },
  { id: 16, mode: 'Balcão', modeClass: '', status: 'queue', created: '20:06', mins: 8, items: [['1x','Frango com Catupiry','Média'],['1x','Refrigerante Guaraná','2L']] },
  { id: 17, mode: 'Mesa 05', modeClass: 'green', status: 'queue', created: '20:09', mins: 5, items: [['1x','Portuguesa','Grande'],['1x','Borda Cheddar','Adicional']] },
  { id: 14, mode: 'Delivery', modeClass: 'red', status: 'preparing', created: '20:08', mins: 6, progress: 54, items: [['1x','Marguerita','Grande'],['1x','Refrigerante Coca-Cola','2L']] },
  { id: 13, mode: 'Mesa 03', modeClass: 'green', status: 'preparing', created: '20:04', mins: 10, progress: 70, items: [['1x','Quatro Queijos','Grande'],['1x','Pão de Alho','Com Catupiry']] },
  { id: 12, mode: 'Balcão', modeClass: '', status: 'ready', created: '20:11', mins: 3, items: [['1x','Calabresa','Média']] },
  { id: 11, mode: 'Delivery', modeClass: 'red', status: 'ready', created: '20:09', mins: 5, items: [['1x','Frango com Catupiry','Grande'],['1x','Refrigerante Guaraná','2L']] }
];

let finalized = 5;
let timerHandle;

function renderOrder(order) {
  const extra = order.progress !== undefined ? `
    <div class="progress"><span style="width:${order.progress}%"></span></div>
    <button class="action finish" data-id="${order.id}">✓ &nbsp; Marcar como Pronto</button>` :
    order.status === 'queue' ? `<button class="action start" data-id="${order.id}">▶ &nbsp; Iniciar Preparo</button>` :
    `<button class="action deliver" data-id="${order.id}">➤ &nbsp; Pedido Entregue</button>`;

  const items = order.items.map(i => `<div class="item"><span class="qty">${i[0]}</span><span>${i[1]}<small>${i[2]}</small></span></div>`).join('');
  return `<article class="order-card">
    <div class="order-top">
      <div class="order-number">#${String(order.id).padStart(4,'0')}</div>
      <div class="order-meta">
        <div class="badge ${order.modeClass}">${order.mode}</div>
        <div class="timer">◷ &nbsp;${order.mins} min</div>
        <div class="order-time">${order.created}</div>
      </div>
    </div>
    <div class="items">${items}</div>
    ${extra}
  </article>`;
}

function render() {
  const queue = orders.filter(o => o.status === 'queue');
  const preparing = orders.filter(o => o.status === 'preparing');
  const ready = orders.filter(o => o.status === 'ready');
  document.getElementById('queueList').innerHTML = queue.length ? queue.map(renderOrder).join('') : '<div class="empty">Nenhum pedido aguardando.</div>';
  document.getElementById('preparingList').innerHTML = preparing.length ? preparing.map(renderOrder).join('') : '<div class="empty">Nenhum pedido em preparo.</div>';
  document.getElementById('readyList').innerHTML = ready.length ? ready.map(renderOrder).join('') : '<div class="empty">Nenhum pedido pronto.</div>';
  document.getElementById('queueCount').textContent = queue.length;
  document.getElementById('preparingCount').textContent = preparing.length;
  document.getElementById('readyCount').textContent = ready.length;
  document.getElementById('dayOrders').textContent = orders.length + finalized - 5;
  document.getElementById('finalized').textContent = finalized + ready.length;
  const totalMins = orders.reduce((sum, o) => sum + o.mins, 0);
  document.getElementById('avgTime').textContent = `${Math.round(totalMins / orders.length)} min`;

  document.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => moveOrder(Number(btn.dataset.id))));
}

function moveOrder(id) {
  const order = orders.find(o => o.id === id);
  if (!order) return;
  if (order.status === 'queue') {
    order.status = 'preparing'; order.progress = 25;
    showToast(`Pedido #${String(id).padStart(4,'0')} entrou em preparo.`);
  } else if (order.status === 'preparing') {
    order.status = 'ready'; delete order.progress;
    showToast(`Pedido #${String(id).padStart(4,'0')} está pronto para expedição.`);
  } else {
    order.status = 'done'; finalized++;
    showToast(`Pedido #${String(id).padStart(4,'0')} entregue.`);
  }
  render();
}

function tick() {
  const now = new Date();
  document.getElementById('date').textContent = now.toLocaleDateString('pt-BR');
  document.getElementById('clock').textContent = now.toLocaleTimeString('pt-BR', { hour12:false });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(timerHandle);
  timerHandle = setTimeout(() => toast.classList.remove('show'), 2200);
}

document.getElementById('refreshBtn').addEventListener('click', () => {
  render();
  showToast('Painel atualizado.');
});

tick();
setInterval(tick, 1000);
render();
