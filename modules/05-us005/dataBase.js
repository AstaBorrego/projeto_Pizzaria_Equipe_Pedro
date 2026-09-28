/* ==========================================
   BELLA MASSA - BANCO DE DADOS LOCAL (CRUD)
   ========================================== */

const DB_KEYS = {
  PEDIDOS: 'bellaMassa_pedidos',
  CLIENTES: 'bella_massa_clientes',
  MOTOBOYS: 'bellaMassa_motoboys',
  CAIXA: 'bellaMassa_caixa'
};

const DB = {
  // -----------------------------------------------------------------
  // 1. PEDIDOS (CRUD)
  // -----------------------------------------------------------------
  getPedidos() {
    return JSON.parse(localStorage.getItem(DB_KEYS.PEDIDOS) || '[]');
  },

  getPedidoPorId(id) {
    const pedidos = this.getPedidos();
    return pedidos.find(p => p.id === Number(id) || p.id === String(id));
  },

  salvarPedido(pedido) {
    const pedidos = this.getPedidos();
    const index = pedidos.findIndex(p => Number(p.id) === Number(pedido.id));
    
    if (index !== -1) {
      // Alterar (Update)
      pedidos[index] = { ...pedidos[index], ...pedido, dataAtualizacao: new Date().toISOString() };
    } else {
      // Cadastrar (Create)
      if (!pedido.id) pedido.id = Date.now();
      if (!pedido.status) pedido.status = 'pending';
      pedido.dataCriacao = new Date().toISOString();
      pedidos.push(pedido);
    }

    localStorage.setItem(DB_KEYS.PEDIDOS, JSON.stringify(pedidos));
    this.notificar('pedidos');
    return pedido;
  },

  atualizarStatusPedido(id, novoStatus) {
    const pedidos = this.getPedidos();
    const index = pedidos.findIndex(p => Number(p.id) === Number(id));
    if (index !== -1) {
      pedidos[index].status = novoStatus;
      pedidos[index].dataAtualizacao = new Date().toISOString();
      localStorage.setItem(DB_KEYS.PEDIDOS, JSON.stringify(pedidos));
      this.notificar('pedidos');
    }
  },

  deletarPedido(id) {
    let pedidos = this.getPedidos();
    pedidos = pedidos.filter(p => Number(p.id) !== Number(id));
    localStorage.setItem(DB_KEYS.PEDIDOS, JSON.stringify(pedidos));
    this.notificar('pedidos');
  },

  // -----------------------------------------------------------------
  // 2. CLIENTES / CRM (CRUD)
  // -----------------------------------------------------------------
  getClientes() {
    return JSON.parse(localStorage.getItem(DB_KEYS.CLIENTES) || '[]');
  },

  salvarCliente(cliente) {
    const clientes = this.getClientes();
    const index = clientes.findIndex(c => String(c.id) === String(cliente.id));

    if (index !== -1) {
      clientes[index] = { ...clientes[index], ...cliente };
    } else {
      if (!cliente.id) cliente.id = Date.now().toString();
      clientes.unshift(cliente);
    }

    localStorage.setItem(DB_KEYS.CLIENTES, JSON.stringify(clientes));
    this.notificar('clientes');
    return cliente;
  },

  deletarCliente(id) {
    let clientes = this.getClientes();
    clientes = clientes.filter(c => String(c.id) !== String(id));
    localStorage.setItem(DB_KEYS.CLIENTES, JSON.stringify(clientes));
    this.notificar('clientes');
  },

  // -----------------------------------------------------------------
  // 3. SINCRONIZAÇÃO EM TEMPO REAL
  // -----------------------------------------------------------------
  notificar(entidade) {
    window.dispatchEvent(new CustomEvent(`db:${entidade}Updated`));
  }
};

// Escuta alterações vindas de outras janelas/iframes
window.addEventListener('storage', (e) => {
  if (Object.values(DB_KEYS).includes(e.key)) {
    window.dispatchEvent(new CustomEvent('db:externalChange', { detail: { key: e.key } }));
  }
});

// Expõe o banco no escopo global
window.DB = DB;