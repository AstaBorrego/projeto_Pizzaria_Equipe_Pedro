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

const CARDAPIO_KEY = 'bella_massa_cardapio';

const DEFAULT_CARDAPIO = [
  {
    nome: "Calabresa Especial",
    categoria: "Pizza Salgada",
    preco: 48.90,
    ingredientes: "Molho de tomate, muçarela, calabresa fatiada e cebola.",
    disponivel: "Disponível"
  }
];

// Dicionário completo contendo ingredientes e preços sugeridos
const catalogoCompleto = {
  // Pizzas Salgadas
  "Calabresa": { preco: 45.00, ingredientes: "Molho de tomate, mussarela, calabresa fatiada e cebola.", categoria: "Pizza Salgada" },
  "Mussarela": { preco: 42.00, ingredientes: "Molho de tomate, dupla camada de mussarela e orégano.", categoria: "Pizza Salgada" },
  "Marguerita": { preco: 46.00, ingredientes: "Molho de tomate, mussarela, rodelas de tomate, manjericão fresco e parmesão.", categoria: "Pizza Salgada" },
  "Portuguesa": { preco: 50.00, ingredientes: "Molho de tomate, mussarela, presunto, ovos, cebola, ervilha e azeitona.", categoria: "Pizza Salgada" },
  "Frango com Catupiry": { preco: 49.00, ingredientes: "Molho de tomate, mussarela, frango desfiado temperado e legítimo Catupiry.", categoria: "Pizza Salgada" },
  "Quatro Queijos": { preco: 52.00, ingredientes: "Molho de tomate, mussarela, provolone, gorgonzola e parmesão.", categoria: "Pizza Salgada" },
  "Bacon": { preco: 48.00, ingredientes: "Molho de tomate, mussarela e fatias de bacon crocante.", categoria: "Pizza Salgada" },
  "Toscana": { preco: 46.00, ingredientes: "Molho de tomate, mussarela, calabresa moída e cebola.", categoria: "Pizza Salgada" },
  "Brócolis com Bacon": { preco: 49.00, ingredientes: "Molho de tomate, mussarela, brócolis ninja, alho frito e bacon.", categoria: "Pizza Salgada" },
  "Lombo Canadense": { preco: 51.00, ingredientes: "Molho de tomate, mussarela, lombo canadense fatiado e cebola.", categoria: "Pizza Salgada" },
  "Baiana": { preco: 47.00, ingredientes: "Molho de tomate, mussarela, calabresa moída, ovos, pimenta, cebola e pimentão.", categoria: "Pizza Salgada" },
  "Pepperoni": { preco: 54.00, ingredientes: "Molho de tomate, mussarela e fatias de pepperoni.", categoria: "Pizza Salgada" },
  
  // Pizzas Doces
  "Brigadeiro": { preco: 45.00, ingredientes: "Leite condensado, chocolate ao leite derretido coberto com granulado de chocolate.", categoria: "Pizza Doce" },
  "Prestígio": { preco: 47.00, ingredientes: "Leite condensado, chocolate ao leite derretido e coco ralado.", categoria: "Pizza Doce" },
  "Romeu e Julieta": { preco: 44.00, ingredientes: "Goiabada derretida e queijo mussarela (ou catupiry).", categoria: "Pizza Doce" },
  "Banana com Canela": { preco: 42.00, ingredientes: "Leite condensado, fatias de banana, açúcar e canela em pó.", categoria: "Pizza Doce" },

  // Bebidas
  "Coca-Cola 2L": { preco: 14.00, ingredientes: "Bebida gelada.", categoria: "Bebida" },
  "Guaraná Antarctica 2L": { preco: 12.00, ingredientes: "Bebida gelada.", categoria: "Bebida" },
  "Fanta Laranja 2L": { preco: 12.00, ingredientes: "Bebida gelada.", categoria: "Bebida" },
  "Sprite 2L": { preco: 12.00, ingredientes: "Bebida gelada.", categoria: "Bebida" },
  "Coca-Cola Lata 350ml": { preco: 6.00, ingredientes: "Bebida gelada.", categoria: "Bebida" },
  "Guaraná Lata 350ml": { preco: 6.00, ingredientes: "Bebida gelada.", categoria: "Bebida" },
  "Suco Del Valle Uva 1L": { preco: 9.00, ingredientes: "Bebida gelada.", categoria: "Bebida" },
  "Água Sem Gás 500ml": { preco: 4.00, ingredientes: "Bebida gelada.", categoria: "Bebida" },
  "Água Com Gás 500ml": { preco: 4.50, ingredientes: "Bebida gelada.", categoria: "Bebida" }
};

let cardapioItems = loadCardapio();

window.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  renderizarCardapio();

  const nomeInput = document.getElementById("nomeItem");
  const ingredientesInput = document.getElementById("ingredientesItem");
  const categoriaInput = document.getElementById("categoriaItem");
  const precoInput = document.getElementById("precoItem");
  const statusInput = document.getElementById("statusItem");
  const editIndexInput = document.getElementById("editIndex");

  // Verifica se veio um índice de edição vindo da Tela 3 via localStorage
  const editIndexStorage = localStorage.getItem('bella_massa_edit_index');
  if (editIndexStorage !== null && editIndexStorage !== "") {
    const index = parseInt(editIndexStorage, 10);
    const item = cardapioItems[index];

    if (item) {
      if (nomeInput) nomeInput.value = item.nome;
      if (categoriaInput) categoriaInput.value = item.categoria;
      if (precoInput) precoInput.value = item.preco.toFixed(2).replace(".", ",");
      if (ingredientesInput) {
        ingredientesInput.value = item.ingredientes || "";
        ingredientesInput.dataset.customized = "true";
      }
      if (statusInput) statusInput.value = item.disponivel || "Disponível";
      
      if (editIndexInput) {
        editIndexInput.value = index;
      }

      const btnSalvar = document.getElementById("btnSalvar");
      if (btnSalvar) btnSalvar.textContent = "✓ Atualizar Item";

      const btnCancelar = document.getElementById("btnCancelar");
      if (btnCancelar) btnCancelar.classList.remove("hidden");

      const layout = document.getElementById("catalogLayout");
      if (layout) {
        layout.classList.add("tabela-oculta");
      }
    }
  }

  function preencherDadosAutomaticos() {
    if (!nomeInput) return;
    const valorDigitado = nomeInput.value.trim();

    const chaveEncontrada = Object.keys(catalogoCompleto).find(
      key => key.toLowerCase() === valorDigitado.toLowerCase()
    );

    if (chaveEncontrada) {
      const dadosItem = catalogoCompleto[chaveEncontrada];

      if (ingredientesInput && (!ingredientesInput.value || !ingredientesInput.dataset.customized)) {
        ingredientesInput.value = dadosItem.ingredientes;
      }
      if (categoriaInput && !categoriaInput.value) {
        categoriaInput.value = dadosItem.categoria;
      }
      if (precoInput && (!precoInput.value || precoInput.value === "0,00")) {
        precoInput.value = dadosItem.preco.toFixed(2).replace(".", ",");
      }
    }
  }

  if (nomeInput) {
    nomeInput.addEventListener("blur", preencherDadosAutomaticos);
    nomeInput.addEventListener("change", preencherDadosAutomaticos);
  }

  if (ingredientesInput) {
    ingredientesInput.addEventListener("input", () => {
      ingredientesInput.dataset.customized = "true";
    });
  }

  if (precoInput) {
    precoInput.addEventListener("input", (e) => {
      if (typeof maskMoney === 'function') {
        maskMoney(e.target);
      }
    });
  }
});

function loadCardapio() {
  const saved = localStorage.getItem(CARDAPIO_KEY);
  if (!saved) {
    return structuredClone(DEFAULT_CARDAPIO);
  }
  try {
    return JSON.parse(saved);
  } catch (error) {
    console.error("Erro ao carregar cardápio:", error);
    return structuredClone(DEFAULT_CARDAPIO);
  }
}

function salvarItemCardapio() {
  const nomeInput = document.getElementById("nomeItem");
  const categoriaInput = document.getElementById("categoriaItem");
  const precoInput = document.getElementById("precoItem");
  const ingredientesInput = document.getElementById("ingredientesItem");
  const statusInput = document.getElementById("statusItem");
  const editIndexInput = document.getElementById("editIndex");

  const nome = nomeInput.value.trim();
  const categoria = categoriaInput.value;
  const precoStr = precoInput.value.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
  const preco = parseFloat(precoStr);
  const ingredientes = ingredientesInput ? ingredientesInput.value.trim() : "";
  const disponivel = statusInput ? statusInput.value : "Disponível";

  if (!nome) {
    showMessage("Por favor, informe o nome do item!");
    nomeInput.focus();
    return;
  }
  if (!categoria) {
    showMessage("Por favor, selecione a categoria!");
    categoriaInput.focus();
    return;
  }
  if (isNaN(preco) || preco <= 0) {
    showMessage("Por favor, informe um preço válido!");
    precoInput.focus();
    return;
  }

  // Descobre o índice de edição de forma segura (input hidden ou localStorage)
  let editIndex = -1;
  if (editIndexInput && editIndexInput.value !== "") {
    editIndex = parseInt(editIndexInput.value, 10);
  } else {
    const editIndexStorage = localStorage.getItem('bella_massa_edit_index');
    if (editIndexStorage !== null && editIndexStorage !== "") {
      editIndex = parseInt(editIndexStorage, 10);
    } else {
      editIndex = cardapioItems.findIndex(item => item.nome.toLowerCase() === nome.toLowerCase());
    }
  }

  // Verifica duplicidade apenas se houver OUTRO item com o mesmo nome em um índice diferente
  const nomeLowerCase = nome.toLowerCase();
  const itemDuplicadoIndex = cardapioItems.findIndex((item, index) => {
    return index !== editIndex && item.nome.toLowerCase() === nomeLowerCase;
  });

  if (itemDuplicadoIndex !== -1) {
    showMessage(`⚠️ O item "${nome}" já está cadastrado no cardápio!`);
    nomeInput.focus();
    return;
  }

  const novoItem = {
    nome,
    categoria,
    preco,
    ingredientes,
    disponivel
  };

  if (editIndex !== -1 && editIndex >= 0 && editIndex < cardapioItems.length) {
    cardapioItems[editIndex] = novoItem;
    showMessage("✓ Item atualizado com sucesso!");
  } else {
    cardapioItems.push(novoItem);
    showMessage("✓ Item cadastrado com sucesso!");
  }

  localStorage.setItem(CARDAPIO_KEY, JSON.stringify(cardapioItems));
  
  // Limpa o cache de edição do localStorage ao salvar com sucesso
  localStorage.removeItem('bella_massa_edit_index');

  limparFormulario();
  renderizarCardapio();
  mostrarTabela();
}

function cadastrarNovoItem() {
  localStorage.removeItem('bella_massa_edit_index');
  const layout = document.getElementById("catalogLayout");
  if (layout) {
    layout.classList.add("tabela-oculta");
  }
  limparFormulario();
}

function mostrarTabela() {
  localStorage.removeItem('bella_massa_edit_index');
  const layout = document.getElementById("catalogLayout");
  if (layout) {
    layout.classList.remove("tabela-oculta");
  }
}

function renderizarCardapio() {
  const tbody = document.getElementById("tabelaCardapio");
  const buscaInput = document.getElementById("buscaCardapio");
  if (!tbody) return;

  const termoBusca = buscaInput ? buscaInput.value.toLowerCase() : "";
  tbody.innerHTML = "";

  const itensFiltrados = cardapioItems.filter(item => 
    item.nome.toLowerCase().includes(termoBusca) || 
    item.categoria.toLowerCase().includes(termoBusca)
  );

  if (itensFiltrados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding:15px; text-align:center; color:var(--text-muted);">Nenhum item encontrado.</td></tr>`;
    return;
  }

  itensFiltrados.forEach((item) => {
    const realIndex = cardapioItems.indexOf(item);
    const corStatus = item.disponivel === "Disponível" ? "var(--basil-green)" : "var(--pizza-red)";

    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid var(--border-color)";
    tr.innerHTML = `
      <td style="padding:12px 10px;"><strong>${item.nome}</strong>${item.ingredientes ? `<br><small style="color:var(--text-muted);">${item.ingredientes}</small>` : ''}</td>
      <td style="padding:12px 10px; color:var(--text-muted);">${item.categoria}</td>
      <td style="padding:12px 10px; color:var(--cheese-gold); font-weight:600;">${formatMoney(item.preco)}</td>
      <td style="padding:12px 10px;"><span style="color:${corStatus}; font-weight:600;">${item.disponivel}</span></td>
      <td style="padding:12px 10px; display:flex; gap:6px;">
        <button onclick="editarItem(${realIndex})" style="padding:5px 10px; background:rgba(255,179,0,0.2); border:1px solid var(--cheese-gold); border-radius:6px; cursor:pointer; color:var(--cheese-gold); font-size:0.75rem; font-weight:600;">Editar</button>
        <button onclick="excluirItem(${realIndex})" style="padding:5px 10px; background:rgba(211,47,47,0.2); border:1px solid var(--pizza-red); border-radius:6px; cursor:pointer; color:var(--pizza-red); font-size:0.75rem; font-weight:600;">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editarItem(index) {
  const item = cardapioItems[index];
  if (!item) return;

  const inputNome = document.getElementById("nomeItem");
  const inputCategoria = document.getElementById("categoriaItem");
  const inputPreco = document.getElementById("precoItem");
  const inputIngredientes = document.getElementById("ingredientesItem");
  const inputStatus = document.getElementById("statusItem");
  const editIndexInput = document.getElementById("editIndex");

  if (inputNome) inputNome.value = item.nome;
  if (inputCategoria) inputCategoria.value = item.categoria;
  if (inputPreco) inputPreco.value = item.preco.toFixed(2).replace(".", ",");
  if (inputIngredientes) {
    inputIngredientes.value = item.ingredientes || "";
    inputIngredientes.dataset.customized = "true";
  }
  if (inputStatus) inputStatus.value = item.disponivel;
  
  if (editIndexInput) {
    editIndexInput.value = index;
  }

  const btnSalvar = document.getElementById("btnSalvar");
  if (btnSalvar) btnSalvar.textContent = "✓ Atualizar Item";

  const btnCancelar = document.getElementById("btnCancelar");
  if (btnCancelar) btnCancelar.classList.remove("hidden");

  const layout = document.getElementById("catalogLayout");
  if (layout) {
    layout.classList.add("tabela-oculta");
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
  localStorage.removeItem('bella_massa_edit_index');
  limparFormulario();
  mostrarTabela();
  showMessage("Edição cancelada.");
}

function excluirItem(index) {
  if (confirm("Tem certeza que deseja excluir este item do cardápio?")) {
    cardapioItems.splice(index, 1);
    
    if (typeof salvarNoLocalStorage === 'function') {
      salvarNoLocalStorage();
    } else {
      localStorage.setItem(CARDAPIO_KEY, JSON.stringify(cardapioItems));
    }

    renderizarCardapio();
    limparFormulario();
    showMessage("🗑️ Item removido com sucesso!");
  }
}

function limparFormulario() {
  const nomeItem = document.getElementById("nomeItem");
  const categoriaItem = document.getElementById("categoriaItem");
  const precoItem = document.getElementById("precoItem");
  
  if (nomeItem) nomeItem.value = "";
  if (categoriaItem) categoriaItem.value = "";
  if (precoItem) precoItem.value = "0,00";
  
  const ingredientesInput = document.getElementById("ingredientesItem");
  if (ingredientesInput) {
    ingredientesInput.value = "";
    delete ingredientesInput.dataset.customized;
  }
  
  const statusInput = document.getElementById("statusItem");
  if (statusInput) {
    statusInput.value = "Disponível";
  }

  const editIndexInput = document.getElementById("editIndex");
  if (editIndexInput) editIndexInput.value = "";

  const btnSalvar = document.getElementById("btnSalvar");
  if (btnSalvar) btnSalvar.textContent = "✓ Salvar Item";

  const btnCancelar = document.getElementById("btnCancelar");
  if (btnCancelar) btnCancelar.classList.add("hidden");
}

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

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

function showMessage(message) {
  const modal = document.getElementById("customModal");
  const modalMessage = document.getElementById("modalMessage");
  const modalIcon = document.getElementById("modalIcon");
  if (!modal || !modalMessage) return;

  modalMessage.textContent = message;

  if (message.includes("✓") || message.includes("sucesso")) {
    modalIcon.textContent = "✅";
  } else if (message.includes("🗑️") || message.includes("removido")) {
    modalIcon.textContent = "🗑️";
  } else {
    modalIcon.textContent = "⚠️";
  }

  modal.classList.remove("hidden");
}

function fecharModal() {
  const modal = document.getElementById("customModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

window.setTheme = setTheme;
window.salvarItemCardapio = salvarItemCardapio;
window.cadastrarNovoItem = cadastrarNovoItem;
window.mostrarTabela = mostrarTabela;
window.editarItem = editarItem;
window.excluirItem = excluirItem;
window.cancelarEdicao = cancelarEdicao;
window.renderizarCardapio = renderizarCardapio;
window.fecharModal = fecharModal;