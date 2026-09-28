/* ==========================================
   BELLA MASSA - SCRIPT DO DASHBOARD GERAL
   ========================================== */

const THEME_STORAGE_KEY = 'bellaMassa_theme';

function setTheme(mode) {
  const btnLight = document.getElementById('btnLight');
  const btnDark = document.getElementById('btnDark');

  if (mode === 'light') {
    document.body.classList.add('light-theme');
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    if (btnLight) btnLight.classList.add('active');
    if (btnDark) btnDark.classList.remove('active');
  } else {
    document.body.classList.remove('light-theme');
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    if (btnDark) btnDark.classList.add('active');
    if (btnLight) btnLight.classList.remove('active');
  }
}
window.setTheme = setTheme;

function carregarDadosDashboard() {
  let pedidos = [];
  
  // CORREÇÃO: Prioriza a leitura do banco de dados oficial (DB) ou a chave correta da Bella Massa
  try {
    if (typeof DB !== 'undefined' && typeof DB.getPedidos === 'function') {
      pedidos = DB.getPedidos() || [];
    } else if (localStorage.getItem('bellaMassa_pedidos')) {
      pedidos = JSON.parse(localStorage.getItem('bellaMassa_pedidos'));
    } else if (localStorage.getItem('pizzaria_pedidos')) {
      pedidos = JSON.parse(localStorage.getItem('pizzaria_pedidos'));
    }
  } catch (e) {
    console.error("Erro ao ler dados do localStorage:", e);
    pedidos = [];
  }

  // Garantia de que pedidos seja sempre um array
  if (!Array.isArray(pedidos)) pedidos = [];

  // Aplicação do filtro de período
  const periodoFilter = document.getElementById('periodoFilter');
  const periodo = periodoFilter ? periodoFilter.value : 'todos';
  if (periodo !== 'todos') {
    pedidos = filtrarPedidosPorPeriodo(pedidos, periodo);
  }

  let totalPedidos = pedidos.length;
  let totalEntregasConcluidas = 0;
  let faturamentoTotal = 0;
  let faturamentoConcluido = 0;
  let faturamentoPendente = 0;

  let pendentesEmPreparo = 0;
  let concluidos = 0;
  let cancelados = 0;

  let qtdDelivery = 0;
  let qtdBalcao = 0;

  pedidos.forEach(p => {
    // CORREÇÃO: Tenta capturar o valor considerando strings formatadas ou diferentes nomenclaturas
    let rawValor = p.totalPedido || p.total || p.valor || p.preco || p.subtotal || 0;
    if (typeof rawValor === 'string') {
       // Se o valor vier como "R$ 194,50", converte para float
       rawValor = rawValor.replace(/[^\d.,]/g, '').replace(',', '.');
    }
    const valor = parseFloat(rawValor) || 0;
    faturamentoTotal += valor;

    const status = String(p.status || p.estado || p.situacao || '').toLowerCase();
    const modalidade = String(p.tipo || p.modalidade || p.formaEntrega || p.servico || '').toLowerCase();
    
    const isDelivery = modalidade.includes('entrega') || modalidade.includes('delivery');
    
    // Inclui a verificação de motoboyId e transit
    const motoboyAtribuido = Boolean(p.motoboyId || p.motoboy || p.atribuido || status.includes('atribuido') || status.includes('transit') || status.includes('saiu') || status.includes('dispatched'));
    
    const prontoCozinha = status.includes('pronto') || status.includes('cozinha') || status.includes('preparado');
    
    // Inclui a leitura correta de delivered e archived usados no módulo de entregas
    const concluidoGeral = status.includes('concluido') || status.includes('entregue') || status.includes('delivered') || status.includes('pago') || status.includes('finalizado') || status.includes('archived');

    if (isDelivery) {
      qtdDelivery++;
      if (concluidoGeral || motoboyAtribuido) {
        totalEntregasConcluidas++;
      }
    } else {
      qtdBalcao++;
    }

    if (status.includes('cancelado')) {
      cancelados++;
    } else if (concluidoGeral || (isDelivery && motoboyAtribuido) || prontoCozinha) {
      concluidos++;
      faturamentoConcluido += valor;
    } else {
      pendentesEmPreparo++;
      faturamentoPendente += valor;
    }
  });

  const ticketMedio = totalPedidos > 0 ? faturamentoTotal / totalPedidos : 0;
  const taxaEntrega = qtdDelivery > 0 ? (totalEntregasConcluidas / qtdDelivery) * 100 : 0;

  atualizarTexto('totalPedidos', totalPedidos);
  atualizarTexto('totalEntregas', totalEntregasConcluidas);
  atualizarTexto('faturamentoTotal', formatarMoeda(faturamentoTotal));
  atualizarTexto('ticketMedio', formatarMoeda(ticketMedio));

  atualizarTexto('pedidosPendentes', pendentesEmPreparo);
  atualizarTexto('pedidosConcluidos', concluidos);
  atualizarTexto('pedidosCancelados', cancelados);

  atualizarTexto('qtdDelivery', qtdDelivery);
  atualizarTexto('qtdBalcao', qtdBalcao);
  atualizarTexto('taxaEntrega', taxaEntrega.toFixed(0) + '%');

  atualizarTexto('fatBruto', formatarMoeda(faturamentoTotal));
  atualizarTexto('fatConcluido', formatarMoeda(faturamentoConcluido));
  atualizarTexto('fatPendente', formatarMoeda(faturamentoPendente));
}

function atualizarTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.innerText = valor;
}

function formatarMoeda(valor) {
  return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`;
}

function filtrarPedidosPorPeriodo(pedidos, periodo) {
  const agora = new Date();
  return pedidos.filter(p => {
    // Busca a referência de data (alguns usam o próprio ID do pedido como timestamp)
    const dataRef = p.dataHora || p.data || p.criadoEm || p.timestamp || p.id;
    if (!dataRef) return true;
    
    let dataPedido;
    // Tenta interpretar se é uma string ISO ou um timestamp
    if (typeof dataRef === 'string' && dataRef.includes('-')) {
        dataPedido = new Date(dataRef);
    } else {
        dataPedido = new Date(Number(dataRef));
    }

    if (isNaN(dataPedido.getTime())) return true;

    if (periodo === 'hoje') {
      return dataPedido.toDateString() === agora.toDateString();
    } else if (periodo === 'semana') {
      const limite = new Date();
      limite.setDate(agora.getDate() - 7);
      return dataPedido >= limite;
    } else if (periodo === 'mes') {
      return dataPedido.getMonth() === agora.getMonth() && dataPedido.getFullYear() === agora.getFullYear();
    }
    return true;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  setTheme(savedTheme);

  carregarDadosDashboard();

  const periodoFilter = document.getElementById('periodoFilter');
  if (periodoFilter) {
    periodoFilter.addEventListener('change', carregarDadosDashboard);
  }

  // Escuta alterações externas (quando uma venda é feita em outra aba)
  window.addEventListener('storage', () => {
    carregarDadosDashboard();
  });
  
  // Custom event caso use o database.js
  window.addEventListener('db:pedidosUpdated', () => {
    carregarDadosDashboard();
  });
});