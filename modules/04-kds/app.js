// Variável global para armazenar a referência do timer do Toast (evita sobreposição de timeouts)
let timerHandle;

// ==========================================
// 1. GERENCIAMENTO DE TEMA (LIGHT / DARK)
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
// 2. LEITURA E PERSISTÊNCIA VIA BANCO (DB)
// ==========================================
function carregarPedidosKDS() {
  let pedidos = [];
  
  if (typeof DB !== 'undefined' && typeof DB.getPedidos === 'function') {
    pedidos = DB.getPedidos();
  } else {
    pedidos = JSON.parse(localStorage.getItem('bellaMassa_pedidos') || '[]');
  }
  
  renderKDS(pedidos);
}

function renderOrderCard(order) {
  let actionBtn = '';
  if (order.status === 'queue' || order.status === 'pending') {
    actionBtn = `<button class="action start" onclick="alterarStatusPedido(${order.id}, 'preparing')">▶ Iniciar Preparo</button>`;
  } else if (order.status === 'preparing') {
    actionBtn = `<button class="action finish" onclick="alterarStatusPedido(${order.id}, 'ready')">✓ Marcar como Pronto</button>`;
  } else {
    actionBtn = `<button class="action deliver" onclick="alterarStatusPedido(${order.id}, 'delivered')">➤ Pronto p/ Expedição</button>`;
  }

  let itemsHTML = '';
  if (Array.isArray(order.itens) && order.itens.length > 0) {
    itemsHTML = order.itens.map(i => {
      const qty = i.quantity || i[0] || '1x';
      const prod = i.product || i[1] || 'Item';
      const detail = i.size || i.border || i[2] || '';
      const obs = i.obs ? `<br><small style="color:var(--text-muted);">Obs: ${i.obs}</small>` : '';
      
      let detailText = detail !== 'N/A' && detail !== 'Selecione' ? detail : '';
      return `
        <div class="item">
          <span class="qty">${typeof qty === 'number' ? qty + 'x' : qty}</span>
          <span>${prod} <small>${detailText}</small>${obs}</span>
        </div>
      `;
    }).join('');
  } else if (Array.isArray(order.items)) {
    itemsHTML = order.items.map(i => `
      <div class="item">
        <span class="qty">${i[0] || '1x'}</span>
        <span>${i[1] || 'Item'} <small>${i[2] || ''}</small></span>
      </div>
    `).join('');
  } else {
    itemsHTML = '<div class="item"><span>Sem detalhes dos itens</span></div>';
  }

  const badgeClass = order.tipo === 'Entrega' || order.mode === 'Delivery' ? 'red' : order.tipo === 'Salao' ? 'green' : '';
  const tipoTexto = order.tipo || order.mode || 'Balcão';
  const clienteTexto = order.cliente ? `<br><small style="color:var(--text-muted); font-size:11px;">Cliente: ${order.cliente}</small>` : '';

  return `
    <article class="order-card">
      <div class="order-top">
        <div class="order-number">#${order.numero || String(order.id).slice(-4)}</div>
        <div class="badge ${badgeClass}">${tipoTexto}</div>
      </div>
      ${clienteTexto}
      <div class="items">${itemsHTML}</div>
      ${actionBtn}
    </article>
  `;
}

function renderKDS(pedidos) {
  const queue = pedidos.filter(p => p.status === 'queue' || p.status === 'pending');
  const preparing = pedidos.filter(p => p.status === 'preparing');
  const ready = pedidos.filter(p => p.status === 'ready');

  const queueList = document.getElementById('queueList');
  const preparingList = document.getElementById('preparingList');
  const readyList = document.getElementById('readyList');

  if (queueList) queueList.innerHTML = queue.length ? queue.map(renderOrderCard).join('') : '<div class="empty">Nenhum pedido aguardando.</div>';
  if (preparingList) preparingList.innerHTML = preparing.length ? preparing.map(renderOrderCard).join('') : '<div class="empty">Nenhum pedido em preparo.</div>';
  if (readyList) readyList.innerHTML = ready.length ? ready.map(renderOrderCard).join('') : '<div class="empty">Nenhum pedido pronto.</div>';

  if (document.getElementById('queueCount')) document.getElementById('queueCount').textContent = queue.length;
  if (document.getElementById('preparingCount')) document.getElementById('preparingCount').textContent = preparing.length;
  if (document.getElementById('readyCount')) document.getElementById('readyCount').textContent = ready.length;
  if (document.getElementById('dayOrders')) document.getElementById('dayOrders').textContent = pedidos.length;

  const finalizados = pedidos.filter(p => p.status === 'ready' || p.status === 'delivered' || p.status === 'finished' || p.status === 'pronto' || p.status === 'finalizado' || p.status === 'entregue' || p.status === 'completed' || p.status === 'concluido');
  if (document.getElementById('finalized')) {
    document.getElementById('finalized').textContent = finalizados.length;
  }

  // Bloco corrigido e restaurado
  if (document.getElementById('avgTime')) {
    let totalMinutos = 0;
    let countComTempo = 0;

    pedidos.forEach(p => {
      if (p.dataHora) {
        const inicio = new Date(p.dataHora).getTime();
        const fim = new Date().getTime();
        const diffMin = (fim - inicio) / (1000 * 60);
        if (diffMin >= 0 && diffMin < 1440) {
          totalMinutos += diffMin;
          countComTempo++;
        }
      }
    });

    const media = countComTempo > 0 ? Math.round(totalMinutos / countComTempo) : 0;
    document.getElementById('avgTime').textContent = `${media} min`;
  }
}

function alterarStatusPedido(id, novoStatus) {
  if (typeof DB !== 'undefined' && typeof DB.atualizarStatusPedido === 'function') {
    DB.atualizarStatusPedido(id, novoStatus);
  } else {
    let pedidos = JSON.parse(localStorage.getItem('bellaMassa_pedidos') || '[]');
    const index = pedidos.findIndex(p => p.id === id);
    if (index !== -1) {
      pedidos[index].status = novoStatus;
      localStorage.setItem('bellaMassa_pedidos', JSON.stringify(pedidos));
    }
  }
  showToast(`Pedido #${String(id).slice(-4)} atualizado!`);
  carregarPedidosKDS();
}

window.alterarStatusPedido = alterarStatusPedido;
window.carregarPedidosKDS = carregarPedidosKDS;

function tick() {
  const now = new Date();
  const dateEl = document.getElementById('date');
  const clockEl = document.getElementById('clock');
  
  if (dateEl) dateEl.textContent = now.toLocaleDateString('pt-BR');
  if (clockEl) clockEl.textContent = now.toLocaleTimeString('pt-BR', { hour12: false });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(timerHandle);
  timerHandle = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ==========================================
// ESCUTADORES DE EVENTOS
// ==========================================

// Escuta atualizações customizadas do DB
window.addEventListener('db:pedidosUpdated', carregarPedidosKDS);

// Escuta a TELA 1 (Atendimento) em tempo real via evento nativo
window.addEventListener('storage', (e) => {
  if (e.key === 'bellaMassa_pedidos') {
    carregarPedidosKDS();
    showToast("Atenção: A lista de pedidos foi atualizada!");
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('bellaMassa_theme') || 'dark';
  setTheme(savedTheme);

  tick();
  setInterval(tick, 1000);
  carregarPedidosKDS();
});