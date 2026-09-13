// ==========================================
// 1. ALTERNÂNCIA DE TEMA (CLAREAR / ESCURECER)
// ==========================================
function setTheme(theme) {
  const btnLight = document.getElementById('btn-light');
  const btnDark = document.getElementById('btn-dark');

  if (theme === 'light') {
    document.body.classList.add('light-theme');
    if (btnLight) btnLight.classList.add('active');
    if (btnDark) btnDark.classList.remove('active');
  } else {
    document.body.classList.remove('light-theme');
    if (btnDark) btnDark.classList.add('active');
    if (btnLight) btnLight.classList.remove('active');
  }
  localStorage.setItem('pizzaria_theme', theme);
}

// Tornar a função setTheme acessível globalmente pelos atributos onclick do HTML
window.setTheme = setTheme;

// ==========================================
// 2. INTEGRAÇÃO POSTMESSAGE (DADOS DO CLIENTE)
// ==========================================
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
// 3. PERSISTÊNCIA DO CARDÁPIO (LOCALSTORAGE)
// ==========================================
const STORAGE_KEY = 'bella_massa_cardapio';
let editIndex = null;

// Dados mockados padrão
const dadosIniciais = [
  {
    nome: "Calabresa Especial",
    categoria: "Pizza Tradicional",
    preco: 48.90,
    ingredientes: "Molho de tomate especial, muçarela, calabresa fatiada, cebola e orégano.",
    disponivel: "Disponível"
  },
  {
    nome: "Quatro Queijos",
    categoria: "Pizza Tradicional",
    preco: 54.00,
    ingredientes: "Molho de tomate, muçarela, gorgonzola, provolone e catupiry.",
    disponivel: "Disponível"
  },
  {
    nome: "Coca-Cola 2L",
    categoria: "Bebida",
    preco: 14.00,
    ingredientes: "Garrafa de 2 Litros bem gelada.",
    disponivel: "Disponível"
  },
  {
    nome: "Borda de Catupiry",
    categoria: "Borda Recheada",
    preco: 10.00,
    ingredientes: "Recheio extra de Catupiry original na borda.",
    disponivel: "Disponível"
  }
];

function obterCardapio() {
  const dados = localStorage.getItem(STORAGE_KEY);
  if (!dados) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosIniciais));
    return dadosIniciais;
  }
  return JSON.parse(dados);
}

function salvarCardapio(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

// ==========================================
// 4. RENDERIZAÇÃO E OPERAÇÕES DA TABELA
// ==========================================
function renderizarTabela(filtro = '') {
  const tbody = document.getElementById('tabelaCardapio');
  if (!tbody) return;

  const cardapio = obterCardapio();
  tbody.innerHTML = '';

  const itensFiltrados = cardapio.filter(item => 
    item.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    item.categoria.toLowerCase().includes(filtro.toLowerCase())
  );

  if (itensFiltrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
          Nenhum item encontrado no cardápio.
        </td>
      </tr>
    `;
    return;
  }

  itensFiltrados.forEach((item, index) => {
    const isDisponivel = item.disponivel === 'Disponível';
    const badgeClass = isDisponivel ? 'badge-disponivel' : 'badge-esgotado';
    const precoFormatado = parseFloat(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.nome}</strong></td>
      <td>${item.categoria}</td>
      <td><strong>${precoFormatado}</strong></td>
      <td>${item.ingredientes || '-'}</td>
      <td><span class="badge ${badgeClass}">${item.disponivel}</span></td>
      <td class="text-center">
        <button class="btn-action btn-edit" onclick="prepararEdicao(${index})">
          <i class="ph ph-pencil"></i> Editar
        </button>
        <button class="btn-action btn-delete" onclick="excluirPizza(${index})">
          <i class="ph ph-trash"></i> Excluir
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function cadastrarPizza() {
  const nome = document.getElementById('nomePizza').value.trim();
  const categoria = document.getElementById('categoria').value;
  const preco = document.getElementById('precoPizza').value;
  const ingredientes = document.getElementById('ingredientes').value.trim();
  const disponivel = document.getElementById('disponivel').value;

  if (!nome || !categoria || !preco) {
    alert('Por favor, preencha todos os campos obrigatórios (*).');
    return;
  }

  const cardapio = obterCardapio();
  const itemData = {
    nome,
    categoria,
    preco: parseFloat(preco),
    ingredientes,
    disponivel
  };

  if (editIndex !== null) {
    cardapio[editIndex] = itemData;
    editIndex = null;
  } else {
    cardapio.push(itemData);
  }

  salvarCardapio(cardapio);
  cancelarEdicao();
  renderizarTabela();
}

function prepararEdicao(index) {
  const cardapio = obterCardapio();
  const item = cardapio[index];

  document.getElementById('nomePizza').value = item.nome;
  document.getElementById('categoria').value = item.categoria;
  document.getElementById('precoPizza').value = item.preco;
  document.getElementById('ingredientes').value = item.ingredientes;
  document.getElementById('disponivel').value = item.disponivel;

  editIndex = index;
  
  document.getElementById('formTitle').innerHTML = '<i class="ph ph-pencil-simple"></i> Editar Item';
  document.getElementById('btnSalvar').innerHTML = '<i class="ph ph-check-circle"></i> Atualizar Item';
  document.getElementById('btnCancelar').classList.remove('hidden');
}

function cancelarEdicao() {
  editIndex = null;
  document.getElementById('formCardapio').reset();
  document.getElementById('formTitle').innerHTML = '<i class="ph ph-plus-circle"></i> Cadastrar Item';
  document.getElementById('btnSalvar').innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar Item';
  document.getElementById('btnCancelar').classList.add('hidden');
}

function excluirPizza(index) {
  if (confirm('Deseja realmente excluir este item do cardápio?')) {
    const cardapio = obterCardapio();
    cardapio.splice(index, 1);
    salvarCardapio(cardapio);
    renderizarTabela();
  }
}

function filtrarTabela() {
  const termo = document.getElementById('searchInput').value;
  renderizarTabela(termo);
}

// Globalizar funções chamadas por eventos inline no HTML
window.cadastrarPizza = cadastrarPizza;
window.prepararEdicao = prepararEdicao;
window.cancelarEdicao = cancelarEdicao;
window.excluirPizza = excluirPizza;
window.filtrarTabela = filtrarTabela;

// ==========================================
// 5. INICIALIZAÇÃO SEGURA DA APLICAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Restaura a preferência de tema do usuário
  const savedTheme = localStorage.getItem('pizzaria_theme') || 'dark';
  setTheme(savedTheme);

  // Carrega e desenha a tabela inicial
  renderizarTabela();
});