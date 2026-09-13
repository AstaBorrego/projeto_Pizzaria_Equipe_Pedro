/**
 * MÓDULO DE CLIENTES - PIZZARIA
 * Arquitetura baseada em Estado Local com Event Hooks para Integração Externa
 */
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
// Mock de Banco de Dados de Clientes e Histórico
let mockCustomers = [
  {
    id: "1",
    name: "Astarote Borrego",
    phone: "(11) 98765-4321",
    cpf: "123.456.789-00",
    street: "Rua Vergueiro, 1000 - Apt 42",
    neighborhood: "Liberdade",
    complement: "Próximo ao metrô",
    notes: "Prefere massa fina. Sem cebola.",
    isVip: true,
    orders: [
      {
        id: "ORD-9901",
        date: "10/09/2026 - 19:40",
        items: "1x Pizza Calabresa (Borda Catupiry), 1x Guaraná 2L",
        total: 78.50
      },
      {
        id: "ORD-8520",
        date: "25/08/2026 - 20:15",
        items: "1x Pizza Portuguesa, 1x Pizza Chocolate P",
        total: 92.00
      }
    ]
  },
  {
    id: "2",
    name: "Mariana Souza",
    phone: "(11) 91234-5678",
    cpf: "",
    street: "Av. Paulista, 500",
    neighborhood: "Bela Vista",
    complement: "Bloco B",
    notes: "Cliente pede para buzinar ao chegar.",
    isVip: false,
    orders: [
      {
        id: "ORD-7411",
        date: "01/09/2026 - 21:00",
        items: "1x Pizza Frango c/ Catupiry",
        total: 55.00
      }
    ]
  }
];

// Estado da Aplicação
let selectedCustomerId = null;

// Elementos do DOM
const searchInput = document.getElementById('searchInput');
const customerListEl = document.getElementById('customerList');
const customerCountEl = document.getElementById('customerCount');
const btnNewCustomer = document.getElementById('btnNewCustomer');

const emptyStateEl = document.getElementById('emptyState');
const customerFormEl = document.getElementById('customerForm');
const formTitleEl = document.getElementById('formTitle');
const vipTagEl = document.getElementById('vipTag');
const btnCancelEl = document.getElementById('btnCancel');

const historySectionEl = document.getElementById('historySection');
const historyListEl = document.getElementById('historyList');
const btnNewOrderForCustomer = document.getElementById('btnNewOrderForCustomer');

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  renderCustomerList(mockCustomers);
  setupEventListeners();
});

function setupEventListeners() {
  // Busca em Tempo Real
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = mockCustomers.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.cpf.includes(term)
    );
    renderCustomerList(filtered);
  });

  // Abrir Form para Novo Cliente
  btnNewCustomer.addEventListener('click', () => {
    resetForm();
    selectedCustomerId = null;
    formTitleEl.innerText = "Novo Cadastro de Cliente";
    emptyStateEl.classList.add('hidden');
    historySectionEl.classList.add('hidden');
    vipTagEl.classList.add('hidden');
    customerFormEl.classList.remove('hidden');
  });

  // Cancelar Formulário
  btnCancelEl.addEventListener('click', () => {
    resetForm();
    customerFormEl.classList.add('hidden');
    emptyStateEl.classList.remove('hidden');
  });

  // Salvar ou Atualizar Cliente
  customerFormEl.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const customerData = {
      id: selectedCustomerId || Date.now().toString(),
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value,
      cpf: document.getElementById('cpf').value,
      street: document.getElementById('street').value,
      neighborhood: document.getElementById('neighborhood').value,
      complement: document.getElementById('complement').value,
      notes: document.getElementById('notes').value,
      isVip: false,
      orders: selectedCustomerId ? (mockCustomers.find(c => c.id === selectedCustomerId)?.orders || []) : []
    };

    if (selectedCustomerId) {
      // Update
      const index = mockCustomers.findIndex(c => c.id === selectedCustomerId);
      mockCustomers[index] = customerData;
    } else {
      // Create
      mockCustomers.unshift(customerData);
    }

    renderCustomerList(mockCustomers);
    selectCustomer(customerData.id);
    
    // HOOK PARA INTEGRAÇÃO EXTERNA (Ex: Salvar no Backend/API Principal)
    onCustomerSaved(customerData);
  });

  // Disparar Novo Pedido vinculando o Cliente
  btnNewOrderForCustomer.addEventListener('click', () => {
    const customer = mockCustomers.find(c => c.id === selectedCustomerId);
    if (customer) {
      onStartOrderForCustomer(customer);
    }
  });
}

// Renderizar Lista de Clientes
function renderCustomerList(list) {
  customerListEl.innerHTML = '';
  customerCountEl.innerText = list.length;

  if (list.length === 0) {
    customerListEl.innerHTML = `<li style="color: var(--text-muted); text-align:center; padding: 20px;">Nenhum cliente encontrado.</li>`;
    return;
  }

  list.forEach(c => {
    const li = document.createElement('li');
    li.className = `customer-item ${c.id === selectedCustomerId ? 'active' : ''}`;
    li.onclick = () => selectCustomer(c.id);

    li.innerHTML = `
      <div class="customer-item-header">
        <span>${c.name}</span>
        ${c.isVip ? '<i class="ph ph-crown" style="color:var(--warning)"></i>' : ''}
      </div>
      <div class="customer-item-sub">📞 ${c.phone}</div>
      <div class="customer-item-sub">📍 ${c.neighborhood}</div>
    `;
    customerListEl.appendChild(li);
  });
}

// Selecionar Cliente e Mostrar Detalhes / Histórico
function selectCustomer(id) {
  selectedCustomerId = id;
  const customer = mockCustomers.find(c => c.id === id);
  if (!customer) return;

  // Atualiza classes ativas na lista
  renderCustomerList(mockCustomers);

  // Preenche Formulário
  document.getElementById('customerId').value = customer.id;
  document.getElementById('name').value = customer.name;
  document.getElementById('phone').value = customer.phone;
  document.getElementById('cpf').value = customer.cpf;
  document.getElementById('street').value = customer.street;
  document.getElementById('neighborhood').value = customer.neighborhood;
  document.getElementById('complement').value = customer.complement;
  document.getElementById('notes').value = customer.notes;

  formTitleEl.innerText = "Editar Cliente";
  if (customer.isVip) {
    vipTagEl.classList.remove('hidden');
  } else {
    vipTagEl.classList.add('hidden');
  }

  emptyStateEl.classList.add('hidden');
  customerFormEl.classList.remove('hidden');

  // Renderiza Histórico
  renderHistory(customer.orders);
}

// Renderizar Histórico de Pedidos
function renderHistory(orders) {
  historySectionEl.classList.remove('hidden');
  historyListEl.innerHTML = '';

  if (!orders || orders.length === 0) {
    historyListEl.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhum pedido anterior cadastrado para este cliente.</p>`;
    return;
  }

  orders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <div class="history-card-header">
        <span>#${order.id}</span>
        <span>${order.date}</span>
      </div>
      <div class="history-items">${order.items}</div>
      <div class="history-footer">
        <span>Total: R$ ${order.total.toFixed(2).replace('.', ',')}</span>
        <button class="btn btn-sm btn-secondary" onclick="onReorder('${order.id}')">
          <i class="ph ph-arrows-counter-clockwise"></i> Repetir Pedido
        </button>
      </div>
    `;
    historyListEl.appendChild(card);
  });
}

function resetForm() {
  customerFormEl.reset();
  document.getElementById('customerId').value = '';
}

/* ==========================================================================
   HOOKS DE INTEGRAÇÃO COM O PROJETO PRINCIPAL (EX: PDV / CAIXA / BACKEND)
   ========================================================================== */

// Evento ao Salvar Cliente
function onCustomerSaved(customerData) {
  console.log("[INTEGRAÇÃO] Cliente Salvo / Atualizado:", customerData);
  // Exemplo de integração via CustomEvent para React, Vue ou JS Vanilla Principal:
  const event = new CustomEvent('crm:customerSaved', { detail: customerData });
  window.dispatchEvent(event);
}

// Evento ao clicar em "Iniciar Pedido para este Cliente"
function onStartOrderForCustomer(customerData) {
  console.log("[INTEGRAÇÃO] Iniciar novo pedido para:", customerData);
  const event = new CustomEvent('crm:startOrder', { detail: customerData });
  window.dispatchEvent(event);
  alert(`Redirecionando para a tela de PDV/Pedidos com o cliente ${customerData.name} selecionado!`);
}

// Evento ao clicar em "Repetir Pedido"
function onReorder(orderId) {
  console.log("[INTEGRAÇÃO] Repetir pedido:", orderId);
  const event = new CustomEvent('crm:reorder', { detail: { orderId } });
  window.dispatchEvent(event);
  alert(`Itens do pedido ${orderId} adicionados ao carrinho atual!`);
}