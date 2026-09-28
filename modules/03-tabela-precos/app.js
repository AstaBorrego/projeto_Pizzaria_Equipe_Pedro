// =========================================================
// INTEGRAÇÃO CRM - Recebimento de dados
// =========================================================
window.addEventListener('message', (event) => {
  try {
    if (event.data && event.data.action === 'LOAD_CUSTOMER_DATA') {
      const cliente = event.data.customer; 
      // Lógica do cliente, se necessário na Tela 3
    }
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
  }
});

// =========================================================
// LÓGICA DO CARDÁPIO E EXIBIÇÃO (TELA 3)
// =========================================================

const CARDAPIO_KEY = 'bella_massa_cardapio';
let cardapioItems = [];
let categoriaAtual = 'Pizza Salgada';

// Inicia ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  
  // 1. Garante que os sabores padrão sejam carregados e atualizados
  carregarCardapioInicialTela3(); 

  // 2. Carrega os itens e renderiza os cards na tela
  cardapioItems = loadCardapio();
  renderizarCardapio();
});

// Função que injeta os sabores e bebidas padrão sem duplicar os existentes
function carregarCardapioInicialTela3() {
  let savedCardapio = [];
  
  try {
    const salvos = localStorage.getItem(CARDAPIO_KEY);
    if (salvos) savedCardapio = JSON.parse(salvos);
  } catch (e) {
    savedCardapio = [];
  }

  const itensPadrao = [
    // --- PIZZAS SALGADAS ---
    { nome: "Calabresa", categoria: "Pizza Salgada", preco: 45.00, disponivel: "Disponível", ingredientes: "Calabresa fatiada, cebola e azeitonas" },
    { nome: "Mussarela", categoria: "Pizza Salgada", preco: 42.00, disponivel: "Disponível", ingredientes: "Mussarela, tomate e orégano" },
    { nome: "Marguerita", categoria: "Pizza Salgada", preco: 46.00, disponivel: "Disponível", ingredientes: "Mussarela, rodelas de tomate e manjericão fresco" },
    { nome: "Portuguesa", categoria: "Pizza Salgada", preco: 50.00, disponivel: "Disponível", ingredientes: "Presunto, mussarela, ovos, cebola, ervilha e azeitonas" },
    { nome: "Frango com Catupiry", categoria: "Pizza Salgada", preco: 49.00, disponivel: "Disponível", ingredientes: "Frango desfiado temperado com catupiry original" },
    { nome: "Quatro Queijos", categoria: "Pizza Salgada", preco: 52.00, disponivel: "Disponível", ingredientes: "Mussarela, provolone, parmesão e gorgonzola" },
    { nome: "Bacon", categoria: "Pizza Salgada", preco: 48.00, disponivel: "Disponível", ingredientes: "Mussarela e cubos crocantes de bacon" },
    { nome: "Toscana", categoria: "Pizza Salgada", preco: 46.00, disponivel: "Disponível", ingredientes: "Calabresa moída com cobertura de mussarela" },
    { nome: "Brócolis com Bacon", categoria: "Pizza Salgada", preco: 49.00, disponivel: "Disponível", ingredientes: "Brócolis refogado, bacon crocante e mussarela" },
    { nome: "Lombo Canadense", categoria: "Pizza Salgada", preco: 51.00, disponivel: "Disponível", ingredientes: "Lombo defumado, catupiry e mussarela" },
    { nome: "Baiana", categoria: "Pizza Salgada", preco: 47.00, disponivel: "Disponível", ingredientes: "Calabresa moída, pimenta malagueta, ovos e cebola" },
    { nome: "Pepperoni", categoria: "Pizza Salgada", preco: 54.00, disponivel: "Disponível", ingredientes: "Fatias de pepperoni importado com mussarela" },

    // --- PIZZAS DOCES ---
    { nome: "Chocolate", categoria: "Pizza Doce", preco: 46.00, disponivel: "Disponível", ingredientes: "Chocolate ao leite derretido" },
    { nome: "Brigadeiro", categoria: "Pizza Doce", preco: 44.00, disponivel: "Disponível", ingredientes: "Chocolate ao leite coberto com granulado" },
    { nome: "Leite Ninho", categoria: "Pizza Doce", preco: 50.00, disponivel: "Disponível", ingredientes: "Creme de avelã polvilhado com Leite Ninho" },
    { nome: "Morango", categoria: "Pizza Doce", preco: 48.00, disponivel: "Disponível", ingredientes: "Chocolate ao leite com fatias frescas de morango" },

    // --- BEBIDAS ---
    { nome: "Coca-Cola 2L", categoria: "Bebidas", preco: 14.00, disponivel: "Disponível", ingredientes: "Garrafa 2 Litros" },
    { nome: "Guaraná Antarctica 2L", categoria: "Bebidas", preco: 12.00, disponivel: "Disponível", ingredientes: "Garrafa 2 Litros" },
    { nome: "Fanta Laranja 2L", categoria: "Bebidas", preco: 12.00, disponivel: "Disponível", ingredientes: "Garrafa 2 Litros" },
    { nome: "Sprite 2L", categoria: "Bebidas", preco: 12.00, disponivel: "Disponível", ingredientes: "Garrafa 2 Litros" },
    { nome: "Coca-Cola Lata 350ml", categoria: "Bebidas", preco: 6.00, disponivel: "Disponível", ingredientes: "Lata 350ml" },
    { nome: "Guaraná Lata 350ml", categoria: "Bebidas", preco: 6.00, disponivel: "Disponível", ingredientes: "Lata 350ml" },
    { nome: "Fanta Laranja Lata 350ml", categoria: "Bebidas", preco: 6.00, disponivel: "Disponível", ingredientes: "Lata 350ml" },
    { nome: "Suco Del Valle Uva 1L", categoria: "Bebidas", preco: 9.00, disponivel: "Disponível", ingredientes: "Caixa 1 Litro" },
    { nome: "Suco Del Valle Pêssego 1L", categoria: "Bebidas", preco: 9.00, disponivel: "Disponível", ingredientes: "Caixa 1 Litro" },
    { nome: "Água Sem Gás 500ml", categoria: "Bebidas", preco: 4.00, disponivel: "Disponível", ingredientes: "Garrafa 500ml" },
    { nome: "Água Com Gás 500ml", categoria: "Bebidas", preco: 4.50, disponivel: "Disponível", ingredientes: "Garrafa 500ml" },
    { nome: "Cerveja Heineken Long Neck", categoria: "Bebidas", preco: 10.00, disponivel: "Disponível", ingredientes: "Long Neck 330ml" },
    
    // --- BORDAS ---
    { nome: "Sem Borda", categoria: "Borda Recheada", preco: 0.00, disponivel: "Disponível", ingredientes: "Massa tradicional" },
    { nome: "Catupiry", categoria: "Borda Recheada", preco: 8.00, disponivel: "Disponível", ingredientes: "Recheio original de Catupiry" },
    { nome: "Cheddar", categoria: "Borda Recheada", preco: 8.00, disponivel: "Disponível", ingredientes: "Recheio cremoso de Cheddar" },
    { nome: "Chocolate Borda", categoria: "Borda Recheada", preco: 10.00, disponivel: "Disponível", ingredientes: "Borda recheada com chocolate ao leite" },
    { nome: "Brigadeiro Borda", categoria: "Borda Recheada", preco: 10.00, disponivel: "Disponível", ingredientes: "Borda recheada com brigadeiro" }
  ];

  // LÓGICA ANTI-DUPLICAÇÃO (MESCLAGEM)
  const mapaItens = new Map();
  
  // 1. Injeta a lista completa padrão no mapa
  itensPadrao.forEach(item => mapaItens.set(item.nome, item));
  
  // 2. Injeta os itens salvos. Isso garante que as suas edições de preço não sejam apagadas!
  savedCardapio.forEach(item => mapaItens.set(item.nome, item));

  // 3. Salva a lista consolidada de volta
  const cardapioConsolidado = Array.from(mapaItens.values());
  localStorage.setItem(CARDAPIO_KEY, JSON.stringify(cardapioConsolidado));
}

// Função para buscar os itens cadastrados no navegador
function loadCardapio() {
  const saved = localStorage.getItem(CARDAPIO_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Erro ao ler cardápio:", error);
    }
  }
  return []; 
}

// Salva os itens no localStorage
function salvarNoLocalStorage() {
  localStorage.setItem(CARDAPIO_KEY, JSON.stringify(cardapioItems));
}

// Alterna entre as abas e atualiza a lista
function mudarCategoria(novaCategoria) {
  categoriaAtual = novaCategoria;
  
  // Atualiza o visual dos botões de aba
  const botoes = document.querySelectorAll('.tab-btn');
  botoes.forEach(btn => {
    btn.classList.remove('active');
    if(btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(novaCategoria)) {
      btn.classList.add('active');
    }
  });
  
  renderizarCardapio();
}

// Desenha os itens na tela
function renderizarCardapio() {
  const container = document.getElementById("gridCardapio");
  const buscaInput = document.getElementById("buscaCardapio");
  if (!container) return;

  const termoBusca = buscaInput ? buscaInput.value.toLowerCase() : "";
  container.innerHTML = "";

  // Filtro inteligente (Ignora conflitos entre "Bebida" e "Bebidas")
  const itensFiltrados = cardapioItems.filter(item => {
    const matchBusca = item.nome.toLowerCase().includes(termoBusca) || 
                       item.categoria.toLowerCase().includes(termoBusca);
                       
    const catItem = item.categoria.toLowerCase();
    const catAtiva = categoriaAtual.toLowerCase();
    
    // Flexibilidade na comparação de categorias
    const matchCategoria = catItem === catAtiva || 
                           (catAtiva.includes('bebida') && catItem.includes('bebida')) ||
                           (catAtiva.includes('doce') && catItem.includes('doce')) ||
                           (catAtiva.includes('salgada') && catItem.includes('salgada')) ||
                           (catAtiva.includes('borda') && catItem.includes('borda'));

    return matchBusca && matchCategoria;
  });

  if (itensFiltrados.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:var(--text-muted); grid-column: 1 / -1; padding: 20px;">Nenhum item encontrado nesta categoria.</p>`;
    return;
  }

  itensFiltrados.forEach((item) => {
    const realIndex = cardapioItems.indexOf(item);
    const corStatus = item.disponivel === "Disponível" ? "var(--basil-green)" : "var(--pizza-red)";

    const card = document.createElement("div");
    card.className = "card-item";
    card.style.cssText = "background: var(--card-bg, #1e1e1e); border: 1px solid var(--border-color, #333); border-radius: 10px; padding: 15px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;";

    card.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
          <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-color);">${item.nome}</h3>
          <span style="font-size: 0.75rem; font-weight: 600; color: ${corStatus};">${item.disponivel || "Disponível"}</span>
        </div>
        <small style="color: var(--text-muted, #888); display: block; margin-top: 4px;">${item.categoria}</small>
        <p style="margin: 8px 0 0 0; font-size: 0.85rem; color: var(--text-color);">${item.ingredientes || 'Sem ingredientes informados.'}</p>
      </div>

      <div>
        <div style="font-size: 1.1rem; font-weight: bold; color: var(--cheese-gold, #ffb300); margin-bottom: 12px;">
          ${formatMoney(item.preco)}
        </div>
        
        <!-- Botões de Editar e Excluir -->
        <div style="display: flex; gap: 8px;">
          <button onclick="editarItem(${realIndex})" style="flex: 1; padding: 6px 10px; background: rgba(255,179,0,0.2); border: 1px solid var(--cheese-gold); border-radius: 6px; cursor: pointer; color: var(--cheese-gold); font-size: 0.8rem; font-weight: 600;">Editar</button>
          <button onclick="excluirItem(${realIndex})" style="flex: 1; padding: 6px 10px; background: rgba(211,47,47,0.2); border: 1px solid var(--pizza-red); border-radius: 6px; cursor: pointer; color: var(--pizza-red); font-size: 0.8rem; font-weight: 600;">Excluir</button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// Função para Redirecionar para a Tela 2 com os dados do item
function editarItem(index) {
  const item = cardapioItems[index];
  if (!item) return;

  // Salva o índice do item no localStorage para a Tela 2 ler
  localStorage.setItem('bella_massa_edit_index', index);

  // Redireciona para a Tela 2
  window.location.href = '../02-cardapio/index.html'; 
}

// Função para Excluir um Item
function excluirItem(index) {
  const item = cardapioItems[index];
  if (!item) return;

  if (confirm(`Deseja realmente excluir o item "${item.nome}" do cardápio?`)) {
    cardapioItems.splice(index, 1);
    salvarNoLocalStorage();
    renderizarCardapio();
  }
}

// Formatação do valor em Reais (R$)
function formatMoney(value) {
  const numValue = Number(value);
  if (isNaN(numValue)) return "R$ 0,00";
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(numValue);
}

// =========================================================
// FUNÇÕES DE TEMA (CLARO / ESCURO)
// =========================================================
function setTheme(mode) {
  const btnLight = document.getElementById('btnLight');
  const btnDark = document.getElementById('btnDark');

  if (mode === "light") {
    document.body.classList.add("light-theme");
    localStorage.setItem("bellaMassa_theme", "light");
    if (btnLight) btnLight.classList.add('active');
    if (btnDark) btnDark.classList.remove('active');
  } else {
    document.body.classList.remove("light-theme");
    localStorage.setItem("bellaMassa_theme", "dark");
    if (btnDark) btnDark.classList.add('active');
    if (btnLight) btnLight.classList.remove('active');
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem("bellaMassa_theme") || "dark";
  setTheme(savedTheme);
}

function fecharModalErro() {
  const modal = document.getElementById('errorModalOverlay');
  if (modal) modal.classList.add('hidden');
}

// Exposição global das funções
window.setTheme = setTheme;
window.renderizarCardapio = renderizarCardapio;
window.mudarCategoria = mudarCategoria;
window.fecharModalErro = fecharModalErro;
window.editarItem = editarItem;
window.excluirItem = excluirItem;