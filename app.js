// 1. Elementos da Shell
const menuButtons = document.querySelectorAll('.menu-btn');
const iframe = document.getElementById('moduleFrame');

// Fila temporária para envio de cliente via postMessage
let clientePendente = null;

// 2. Navegação entre Módulos pela Sidebar
menuButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    menuButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Altera o caminho do iframe sem recarregar a página principal
    const targetModule = btn.getAttribute('data-module');
    if (targetModule) {
      iframe.src = targetModule;
    }
  });
});

// 3. Listener do evento 'load' do iframe (previne travamentos ao alternar abas)
iframe.addEventListener('load', () => {
  if (clientePendente) {
    iframe.contentWindow.postMessage({
      action: 'LOAD_CUSTOMER_DATA',
      customer: clientePendente
    }, '*');
    
    // Limpa a fila após a mensagem ser entregue
    clientePendente = null;
  }
});

// 4. Recebe a requisição do Módulo 08 (Tálamo) para criar pedido
window.addEventListener('message', (event) => {
  const { action, data } = event.data || {};

  if (action === 'SELECT_CUSTOMER_FOR_ORDER') {
    console.log('Cliente selecionado recebido na Shell:', data);
    
    // Guarda os dados para entrega no evento 'load'
    clientePendente = data;
    
    // Alterna para o Módulo 01 (Atendimento)
    const atendimentoBtn = document.querySelector('[data-module="modules/01-atendimento/index.html"]');
    if (atendimentoBtn) {
      atendimentoBtn.click();
    }
  }
});

// ==========================================
// CENTRAL BANCO DE DADOS (localStorage)
// ==========================================
const LocalDB = {
  get(key) {
    const data = localStorage.getItem(`pizzaria_${key}`);
    return data ? JSON.parse(data) : [];
  },
  
  save(key, data) {
    localStorage.setItem(`pizzaria_${key}`, JSON.stringify(data));
  },

  init() {
    if (!localStorage.getItem('pizzaria_cardapio')) {
      this.save('cardapio', [
        { id: 1, nome: 'Calabresa', preco: 45.00, descricao: 'Calabresa e cebola' },
        { id: 2, name: 'Quatro Queijos', preco: 52.00, descricao: 'Mussarela, catupiry, provolone e parmesão' }
      ]);
    }
    if (!localStorage.getItem('pizzaria_clientes')) this.save('clientes', []);
    if (!localStorage.getItem('pizzaria_pedidos')) this.save('pedidos', []);
    if (!localStorage.getItem('pizzaria_caixa')) this.save('caixa', []);
  }
};

// Inicializa o banco local ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  LocalDB.init();
});

// Função para salvar qualquer formulário diretamente no localStorage
function salvarFormulario(modulo, event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const dados = Object.fromEntries(formData.entries());
  dados.id = Date.now();

  const registros = LocalDB.get(modulo);
  registros.push(dados);
  LocalDB.save(modulo, registros);

  alert(`Dados salvos com sucesso no módulo: ${modulo}!`);
  form.reset();
}