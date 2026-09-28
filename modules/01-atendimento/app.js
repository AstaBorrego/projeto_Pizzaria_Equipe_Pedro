/* ==========================================
   BELLA MASSA - ATENDIMENTO (app.js)
   ========================================== */

const CLIENTE_ATIVO_KEY = 'bella_massa_cliente_selecionado'; 
const CARDAPIO_KEY = 'bella_massa_cardapio'; 
const PIZZARIA_ORIGEM = "07043-000, Brasil"; 

let orderItems = []; 
let sessionCounter = parseInt(localStorage.getItem('bellaMassa_counter') || '0', 10); 
let totalAmount = 0; 
let clienteAtual = null; 
let campoComErroAtual = null;

/* ==========================================
   FUNÇÃO CORRIGIDA: getMenuData (Sem erros de sintaxe)
   ========================================== */
function getMenuData() {
  const savedCardapio = localStorage.getItem(CARDAPIO_KEY);

  const pizzasSalgadasPadrao = [
    { name: "Calabresa", price: 45.00, preco: 45.00 },
    { name: "Mussarela", price: 42.00, preco: 42.00 },
    { name: "Marguerita", price: 46.00, preco: 46.00 },
    { name: "Portuguesa", price: 50.00, preco: 50.00 },
    { name: "Frango com Catupiry", price: 49.00, preco: 49.00 },
    { name: "Quatro Queijos", price: 52.00, preco: 52.00 },
    { name: "Bacon", price: 48.00, preco: 48.00 },
    { name: "Toscana", price: 46.00, preco: 46.00 },
    { name: "Brócolis com Bacon", price: 49.00, preco: 49.00 },
    { name: "Lombo Canadense", price: 51.00, preco: 51.00 },
    { name: "Baiana", price: 47.00, preco: 47.00 },
    { name: "Pepperoni", price: 54.00, preco: 54.00 }
  ];

  const pizzasDocesPadrao = [
    { name: "Chocolate", price: 46.00, preco: 46.00 },
    { name: "Brigadeiro", price: 44.00, preco: 44.00 },
    { name: "Leite Ninho", price: 50.00, preco: 50.00 },
    { name: "Morango", price: 48.00, preco: 48.00 }
  ];

  const bebidasPadrao = [
    { name: "Coca-Cola 2L", price: 14.00, preco: 14.00 },
    { name: "Guaraná Antarctica 2L", price: 12.00, preco: 12.00 },
    { name: "Fanta Laranja 2L", price: 12.00, preco: 12.00 },
    { name: "Sprite 2L", price: 12.00, preco: 12.00 },
    { name: "Coca-Cola Lata 350ml", price: 6.00, preco: 6.00 },
    { name: "Guaraná Lata 350ml", price: 6.00, preco: 6.00 },
    { name: "Fanta Laranja Lata 350ml", price: 6.00, preco: 6.00 },
    { name: "Suco Del Valle Uva 1L", price: 9.00, preco: 9.00 },
    { name: "Suco Del Valle Pêssego 1L", price: 9.00, preco: 9.00 },
    { name: "Água Sem Gás 500ml", price: 4.00, preco: 4.00 },
    { name: "Água Com Gás 500ml", price: 4.50, preco: 4.50 },
    { name: "Cerveja Heineken Long Neck", price: 10.00, preco: 10.00 }
  ];

  const bordasPadrao = [
    { name: "Sem Borda", price: 0.00, preco: 0.00 },
    { name: "Catupiry", price: 8.00, preco: 8.00 },
    { name: "Cheddar", price: 8.00, preco: 8.00 },
    { name: "Chocolate", price: 10.00, preco: 10.00 },
    { name: "Brigadeiro", price: 10.00, preco: 10.00 }
  ];

  if (!savedCardapio) {
    return {
      pizzasSalgadas: pizzasSalgadasPadrao,
      pizzasDoces: pizzasDocesPadrao,
      bebidas: bebidasPadrao,
      bordas: bordasPadrao
    };
  }

  try {
    const lista = JSON.parse(savedCardapio);
    
    const pizzasSalgadasLocal = lista
      .filter(i => (i.categoria?.includes('Salgada') || i.categoria === 'Pizza'))
      .map(i => ({ name: i.nome || i.name, price: parseFloat(i.preco !== undefined ? i.preco : i.price) || 45.00 }));
      
    const pizzasDocesLocal = lista
      .filter(i => (i.categoria?.includes('Doce') || i.categoria === 'Sobremesa'))
      .map(i => ({ name: i.nome || i.name, price: parseFloat(i.preco !== undefined ? i.preco : i.price) || 45.00 }));
      
    const bebidasLocal = lista
      .filter(i => i.categoria === 'Bebida')
      .map(i => ({ name: i.nome || i.name, price: parseFloat(i.preco !== undefined ? i.preco : i.price) || 10.00 }));
      
    const bordasLocal = lista
      .filter(i => i.categoria === 'Borda Recheada')
      .map(i => ({ name: i.nome || i.name, price: parseFloat(i.preco !== undefined ? i.preco : i.price) || 0.00 }));

    const mesclar = (padrao, local) => {
      const mapa = new Map();
      padrao.forEach(item => mapa.set(item.name, item));
      local.forEach(item => mapa.set(item.name, item)); 
      return Array.from(mapa.values());
    };

    return {
      pizzasSalgadas: mesclar(pizzasSalgadasPadrao, pizzasSalgadasLocal),
      pizzasDoces: mesclar(pizzasDocesPadrao, pizzasDocesLocal),
      bebidas: mesclar(bebidasPadrao, bebidasLocal),
      bordas: mesclar(bordasPadrao, bordasLocal)
    };
  } catch (e) {
    return {
      pizzasSalgadas: pizzasSalgadasPadrao,
      pizzasDoces: pizzasDocesPadrao,
      bebidas: bebidasPadrao,
      bordas: bordasPadrao
    };
  }
}

/* ==========================================
   FUNÇÃO: updatePizzaFlavorPrices
   ========================================== */
function updatePizzaFlavorPrices() {
  const categoryEl = document.querySelector('input[name="category"]:checked');
  const sizeSelect = document.getElementById('sizeSelect');
  if (!categoryEl) return;

  const f1 = document.getElementById('flavor1Select');
  const f2 = document.getElementById('flavor2Select');
  if (!f1 || !f2) return;

  const currentF1 = f1.value;
  const currentF2 = f2.value;
  const MENU_DATA = getMenuData();

  f1.innerHTML = '<option value="" disabled selected>Selecione o sabor</option>';
  f2.innerHTML = '<option value="Nenhum" selected>Selecione o segundo sabor</option>';

  let listaPizzas = [];
  if (categoryEl.value === 'pizza_salgada') {
    listaPizzas = MENU_DATA.pizzasSalgadas;
  } else if (categoryEl.value === 'pizza_doce') {
    listaPizzas = MENU_DATA.pizzasDoces;
  }

  // Verifica se o tamanho foi escolhido para calcular o preço
  const hasValidSize = sizeSelect && sizeSelect.value && sizeSelect.value !== "Selecione" && sizeSelect.value !== "";
  let sizeRatio = 1.00;
  if (hasValidSize) {
    sizeRatio = parseFloat(sizeSelect.options[sizeSelect.selectedIndex].dataset.ratio);
  }

  listaPizzas.forEach(p => {
    const option = document.createElement('option');
    option.value = p.name;
    
    if (hasValidSize) {
      const calculatedPrice = p.price * sizeRatio;
      option.textContent = `${p.name} - R$ ${calculatedPrice.toFixed(2).replace('.', ',')}`;
    } else {
      option.textContent = p.name;
    }
    
    f1.appendChild(option.cloneNode(true));
    f2.appendChild(option);
  });

  if (currentF1) f1.value = currentF1;
  if (currentF2) f2.value = currentF2;
}

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

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('bellaMassa_theme') || 'dark';
  setTheme(savedTheme);

  localStorage.removeItem('bellaMassa_items');
  orderItems = [];

  const clienteAtivo = localStorage.getItem(CLIENTE_ATIVO_KEY);
  if (clienteAtivo) {
    try {
      clienteAtual = JSON.parse(clienteAtivo);
      preencherDadosClienteForm(clienteAtual);
    } catch(e) {}
  }

  setTimeout(() => {
    if (typeof populateSelects === 'function') {
      populateSelects();
    }
    if (typeof handleCategoryChange === 'function') {
      handleCategoryChange();
    }
    if (typeof toggleModalityFields === 'function') {
      toggleModalityFields();
    }
    
    const counterEl = document.getElementById('counter');
    if (counterEl) counterEl.innerText = typeof sessionCounter !== 'undefined' ? sessionCounter : 0;
    
    if (typeof renderOrder === 'function') {
      renderOrder();
    }
  }, 50);
});

function preencherDadosClienteForm(cliente) {
  if (!cliente) return;
  const inputNome = document.getElementById('nomeCliente') || document.getElementById('inputNome');
  const inputTelefone = document.getElementById('telefoneCliente') || document.getElementById('inputTelefone');
  
  if (inputNome) inputNome.value = cliente.nome || cliente.name || '';
  if (inputTelefone) inputTelefone.value = cliente.telefone || cliente.phone || '';
}

function saveToLocalStorage() {
  localStorage.setItem('bellaMassa_items', JSON.stringify(orderItems));
  localStorage.setItem('bellaMassa_counter', sessionCounter.toString());
}

function populateSelects() {
  const MENU_DATA = getMenuData();

  const drink = document.getElementById('drinkSelect');
  if (drink) {
    drink.innerHTML = '<option value="" disabled selected>Selecione</option>';
    MENU_DATA.bebidas.forEach(b => {
      drink.add(new Option(`${b.name} - R$ ${b.price.toFixed(2).replace('.', ',')}`, b.name));
    });
  }

  const border = document.getElementById('borderSelect');
  if (border) {
    border.innerHTML = '<option value="" disabled selected>Selecione</option>';
    const bordasFiltradas = MENU_DATA.bordas.filter(b => 
      b.name.toLowerCase() !== "sem borda" && b.name.toLowerCase() !== "sem recheio"
    );
    border.add(new Option("Sem Borda - R$ 0,00", "Sem Borda"));
    bordasFiltradas.forEach(b => {
      border.add(new Option(`${b.name} - R$ ${b.price.toFixed(2).replace('.', ',')}`, b.name));
    });
  }

  updatePizzaFlavorPrices();
}

function mostrarModalErro(mensagem, elementoComErro) {
  const modal = document.getElementById('validationModal');
  const msgEl = document.getElementById('validationModalMessage');
  
  if (msgEl) msgEl.innerText = mensagem;
  if (modal) modal.classList.remove('hidden');

  if (elementoComErro) {
    campoComErroAtual = elementoComErro;
    elementoComErro.classList.add('piscando');
  }
}

function closeValidationModal() {
  const modal = document.getElementById('validationModal');
  if (modal) modal.classList.add('hidden');

  if (campoComErroAtual) {
    campoComErroAtual.classList.remove('piscando');
    campoComErroAtual.focus();
    campoComErroAtual = null;
  }
}

function handleCategoryChange() {
  const categoryEl = document.querySelector('input[name="category"]:checked');
  if (!categoryEl) return;
  
  const catVal = categoryEl.value;
  const isPizza = catVal === 'pizza_salgada' || catVal === 'pizza_doce';
  
  const sizeGroupContainer = document.getElementById('sizeGroupContainer');
  const pizzaDivisionGroup = document.getElementById('pizzaDivisionGroup');
  const pizzaFlavorsGroup = document.getElementById('pizzaFlavorsGroup');
  const borderGroup = document.getElementById('borderGroup');
  const drinkGroup = document.getElementById('drinkGroup');
  const borderSelect = document.getElementById('borderSelect');

  if (sizeGroupContainer) sizeGroupContainer.classList.toggle('hidden', !isPizza);
  if (pizzaDivisionGroup) pizzaDivisionGroup.classList.toggle('hidden', !isPizza);
  if (pizzaFlavorsGroup) pizzaFlavorsGroup.classList.toggle('hidden', !isPizza);
  if (borderGroup) borderGroup.classList.toggle('hidden', !isPizza);
  if (drinkGroup) drinkGroup.classList.toggle('hidden', isPizza);

  if (borderSelect) {
    if (catVal === 'pizza_doce') {
      borderSelect.value = "Sem Borda";
      borderSelect.disabled = true;
    } else {
      borderSelect.disabled = false;
    }
  }

  if (isPizza) {
    updatePizzaFlavorPrices();
    togglePizzaDivision();
  }
}

function togglePizzaDivision() {
  const divisionEl = document.querySelector('input[name="pizzaTypeDivision"]:checked');
  const flavor2Container = document.getElementById('flavor2Container');
  const labelFlavor1 = document.getElementById('labelFlavor1');
  
  if (!divisionEl) return;

  const isMeioAMeio = divisionEl.value === 'meio_a_meio';

  if (flavor2Container) {
    flavor2Container.classList.toggle('hidden', !isMeioAMeio);
  }

  if (labelFlavor1) {
    labelFlavor1.innerText = isMeioAMeio ? 'Sabor 1 (Meio a Meio)' : 'Sabor da Pizza (Inteira)';
  }

  if (!isMeioAMeio) {
    const f2 = document.getElementById('flavor2Select');
    if (f2) f2.value = "Nenhum";
  }
}

function toggleModalityFields() {
  const modalityEl = document.querySelector('input[name="modality"]:checked');
  if (!modalityEl) return;
  
  const modality = modalityEl.value;
  const mesaGroup = document.getElementById('mesaGroup');
  const deliveryGroup = document.getElementById('deliveryGroup');

  if (mesaGroup) {
    if (modality === 'Salao') {
      mesaGroup.classList.remove('hidden');
      mesaGroup.style.display = 'block';
    } else {
      mesaGroup.classList.add('hidden');
      mesaGroup.style.display = 'none';
    }
  }

  if (deliveryGroup) {
    if (modality === 'Entrega') {
      deliveryGroup.classList.remove('hidden');
      deliveryGroup.style.display = 'block';
    } else {
      deliveryGroup.classList.add('hidden');
      deliveryGroup.style.display = 'none';
    }
  }

  renderOrder();
}

function toggleCashFields() {
  const methodEl = document.querySelector('input[name="paymentMethod"]:checked');
  if (!methodEl) return;
  
  const method = methodEl.value;
  const cashGroup = document.getElementById('cashGroup');
  if (cashGroup) {
    if (method === 'Dinheiro') {
      cashGroup.classList.remove('hidden');
      cashGroup.style.display = 'block';
    } else {
      cashGroup.classList.add('hidden');
      cashGroup.style.display = 'none';
    }
  }
}

function calculateChange() {
  const cashInput = document.getElementById('cashAmountInput');
  const changeDisplay = document.getElementById('changeDisplay');
  if (!cashInput || !changeDisplay) return;

  const cash = parseFloat(cashInput.value) || 0;
  const change = cash - totalAmount;

  if (cash > 0 && change >= 0) {
    changeDisplay.innerText = `Troco: R$ ${change.toFixed(2).replace('.', ',')}`;
    changeDisplay.style.color = "#2E7D32";
  } else if (cash > 0 && change < 0) {
    changeDisplay.innerText = `Faltam: R$ ${Math.abs(change).toFixed(2).replace('.', ',')}`;
    changeDisplay.style.color = "#D32F2F";
  } else {
    changeDisplay.innerText = `Troco: R$ 0,00`;
  }
}

function addItem() {
  const modalityEl = document.querySelector('input[name="modality"]:checked');
  const categoryEl = document.querySelector('input[name="category"]:checked');

  if (!modalityEl) {
    mostrarModalErro("Campo obrigatório!", document.querySelector('input[name="modality"]'));
    return;
  }

  if (!categoryEl) {
    mostrarModalErro("Campo obrigatório!", document.querySelector('input[name="category"]'));
    return;
  }

  const modality = modalityEl.value;
  const category = categoryEl.value;
  const quantityInput = document.getElementById('quantityInput');
  const quantity = parseInt(quantityInput.value, 10);
  const obs = document.getElementById('obsInput').value.trim();

  if (isNaN(quantity) || quantity <= 0) {
    mostrarModalErro("Campo obrigatório!", quantityInput);
    quantityInput.value = 1;
    return;
  }

  let MENU_DATA;
  try {
    MENU_DATA = getMenuData();
  } catch (error) {
    MENU_DATA = { pizzasSalgadas: [], pizzasDoces: [], bebidas: [], bordas: [] };
  }

  let itemData = {};

  if (category === 'pizza_salgada' || category === 'pizza_doce') {
    const sizeSelect = document.getElementById('sizeSelect');
    
    if (!sizeSelect || !sizeSelect.value || sizeSelect.value === "" || sizeSelect.value === "Selecione") {
      mostrarModalErro("Por favor, selecione o tamanho da pizza!", sizeSelect);
      return;
    }
    
    const sizeName = sizeSelect.value;
    const sizeRatio = parseFloat(sizeSelect.options[sizeSelect.selectedIndex].dataset.ratio);

    const f1Select = document.getElementById('flavor1Select');
    if (!f1Select.value) {
      mostrarModalErro("Campo obrigatório!", f1Select);
      return;
    }
    const f1Name = f1Select.value;
    
    const divisionEl = document.querySelector('input[name="pizzaTypeDivision"]:checked');
    const isMeioAMeio = divisionEl && divisionEl.value === 'meio_a_meio';
    
    let f2Name = "Nenhum";
    if (isMeioAMeio) {
      const f2Select = document.getElementById('flavor2Select');
      if (!f2Select.value || f2Select.value === "Nenhum") {
        mostrarModalErro("Campo obrigatório!", f2Select);
        return;
      }
      f2Name = f2Select.value;
    }

    let listaPizzas = category === 'pizza_salgada' ? MENU_DATA.pizzasSalgadas : MENU_DATA.pizzasDoces;
    const f1Obj = listaPizzas.find(p => p.name === f1Name);
    const f2Obj = f2Name !== "Nenhum" ? listaPizzas.find(p => p.name === f2Name) : null;

    let basePrice = f1Obj ? f1Obj.price : 45.00;
    let desc = f1Name;

    if (isMeioAMeio && f2Name !== "Nenhum") {
      const price2 = f2Obj ? f2Obj.price : 45.00;
      basePrice = Math.max(basePrice, price2);
      desc = `½ ${f1Name} / ½ ${f2Name}`;
    }

    const borderSelect = document.getElementById('borderSelect');
    const borderName = (borderSelect && borderSelect.value) ? borderSelect.value : "Sem Borda";
    
    let borderPrice = 0;
    if (MENU_DATA && MENU_DATA.bordas) {
      const borderObj = MENU_DATA.bordas.find(b => b.name === borderName);
      if (borderObj) borderPrice = borderObj.price;
    }

    const unitPrice = (basePrice * sizeRatio) + borderPrice;

    itemData = {
      type: 'pizza',
      size: sizeName,
      product: desc,
      flavor1: f1Name,
      flavor2: f2Name,
      border: borderName,
      obs: obs,
      unitPrice: unitPrice
    };
  } else {
    const drinkSelect = document.getElementById('drinkSelect');
    if (!drinkSelect.value) {
      mostrarModalErro("Campo obrigatório!", drinkSelect);
      return;
    }
    const drinkName = drinkSelect.value;
    const drinkObj = (MENU_DATA.bebidas || []).find(b => b.name === drinkName);

    itemData = {
      type: 'bebida',
      size: 'N/A',
      product: drinkName,
      flavor1: drinkName,
      flavor2: 'Nenhum',
      border: 'N/A',
      obs: obs,
      unitPrice: drinkObj ? drinkObj.price : 12.00
    };
  }

  const existingIndex = orderItems.findIndex(i =>
    i.type === itemData.type &&
    i.size === itemData.size &&
    i.flavor1 === itemData.flavor1 &&
    i.flavor2 === itemData.flavor2 &&
    i.border === itemData.border &&
    i.obs === itemData.obs
  );

  if (existingIndex !== -1) {
    orderItems[existingIndex].quantity += quantity;
    orderItems[existingIndex].subtotal = orderItems[existingIndex].quantity * orderItems[existingIndex].unitPrice;
  } else {
    itemData.id = Date.now();
    itemData.quantity = quantity;
    itemData.subtotal = quantity * itemData.unitPrice;
    orderItems.push(itemData);
  }

  quantityInput.value = 1;
  const obsInput = document.getElementById('obsInput');
  if (obsInput) obsInput.value = '';

  saveToLocalStorage();
  renderOrder();
}

function updateQty(id, delta) {
  const item = orderItems.find(i => i.id === id);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      orderItems = orderItems.filter(i => i.id !== id);
    } else {
      item.subtotal = item.quantity * item.unitPrice;
    }
    saveToLocalStorage();
    renderOrder();
  }
}

function removeItem(id) {
  orderItems = orderItems.filter(item => item.id !== id);
  saveToLocalStorage();
  renderOrder();
}

function renderOrder() {
  const tbody = document.getElementById('orderBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  let subtotalSum = 0;

  orderItems.forEach((item) => {
    subtotalSum += item.subtotal;
    const row = document.createElement('tr');

    let detailStr = item.border !== 'N/A' ? item.border : '-';
    if (item.obs) detailStr += `<br><small style="color:#666;">Obs: ${item.obs}</small>`;

    let sizeTag = item.size !== 'N/A' ? ` (${item.size})` : '';

    row.innerHTML = `
      <td style="padding: 8px;">
        <button onclick="updateQty(${item.id}, -1)" style="cursor:pointer; font-weight:bold;">-</button>
        <strong>${item.quantity}x</strong>
        <button onclick="updateQty(${item.id}, 1)" style="cursor:pointer; font-weight:bold;">+</button>
        ${item.product}${sizeTag}
      </td>
      <td style="padding: 8px;">${detailStr}</td>
      <td style="padding: 8px;">R$ ${item.subtotal.toFixed(2).replace('.', ',')}</td>
      <td style="padding: 8px; text-align: center;">
        <button onclick="removeItem(${item.id})" style="background:none; border:none; color:#D32F2F; cursor:pointer; font-weight:bold;" title="Remover item">❌</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  const modalityEl = document.querySelector('input[name="modality"]:checked');
  const modality = modalityEl ? modalityEl.value : '';
  let deliveryFee = 0;
  
  if (modality === 'Entrega') {
    const feeInput = document.getElementById('deliveryFeeInput');
    deliveryFee = feeInput ? (parseFloat(feeInput.value) || 7.00) : 7.00;
    
    const rowFee = document.createElement('tr');
    const distanciaInfo = document.getElementById('distanciaInfo');
    const distanciaText = distanciaInfo ? distanciaInfo.innerText : "";
    rowFee.innerHTML = `
      <td style="padding: 8px;"><strong>1x Taxa de Entrega</strong></td>
      <td style="padding: 8px;">Entrega por distância ${distanciaText}</td>
      <td style="padding: 8px;">R$ ${deliveryFee.toFixed(2).replace('.', ',')}</td>
      <td style="padding: 8px; text-align: center;">-</td>
    `;
    tbody.appendChild(rowFee);
  }

  totalAmount = subtotalSum + deliveryFee;
  const totalPriceEl = document.getElementById('totalPrice');
  if (totalPriceEl) totalPriceEl.innerText = `R$ ${totalAmount.toFixed(2).replace('.', ',')}`;
  calculateChange();
}

function confirmOrder() {
  const modalityEl = document.querySelector('input[name="modality"]:checked');
  const paymentMethodEl = document.querySelector('input[name="paymentMethod"]:checked');
  const mesaInput = document.getElementById('mesaInput');
  const addressInput = document.getElementById('addressInput');
  const numeroInput = document.getElementById('numeroInput');

  if (!modalityEl) {
    mostrarModalErro("Campo obrigatório!", document.querySelector('input[name="modality"]'));
    return;
  }
  const modality = modalityEl.value;

  if (modality === 'Salao' && (!mesaInput.value || mesaInput.value <= 0)) {
    mostrarModalErro("Campo obrigatório!", mesaInput);
    return;
  }

  if (modality === 'Entrega') {
    if (!addressInput.value.trim()) {
      mostrarModalErro("Campo obrigatório!", addressInput);
      return;
    }
    if (!numeroInput.value.trim()) {
      mostrarModalErro("Campo obrigatório!", numeroInput);
      return;
    }
  }

  if (orderItems.length === 0) {
    mostrarModalErro("Adicione ao menos um item ao pedido!", document.getElementById('quantityInput'));
    return;
  }

  if (!paymentMethodEl) {
    mostrarModalErro("Atenção! Selecione uma forma de pagamento!", document.querySelector('input[name="paymentMethod"]'));
    return;
  }
  const paymentMethod = paymentMethodEl.value;

  const cash = parseFloat(document.getElementById('cashAmountInput').value) || 0;
  let payInfo = paymentMethod;

  if (paymentMethod === 'Dinheiro' && cash > 0) {
    const troco = cash - totalAmount;
    payInfo += ` (Pago: R$ ${cash.toFixed(2).replace('.', ',')} | Troco: R$ ${troco > 0 ? troco.toFixed(2).replace('.', ',') : '0,00'})`;
  }

  const itemsListHTML = orderItems.map(item => {
    let obsText = item.obs ? ` [Obs: ${item.obs}]` : '';
    let borderText = item.border !== 'N/A' && item.border !== 'Sem Borda' ? ` (${item.border})` : '';
    let sizeText = item.size !== 'N/A' ? ` - ${item.size}` : '';
    return `• ${item.quantity}x ${item.product}${sizeText}${borderText}${obsText} - R$ ${item.subtotal.toFixed(2).replace('.', ',')}`;
  }).join('<br>');

  let destInfo = `<strong>Modalidade:</strong> Retirada Balcão`;
  let enderecoCompleto = '';
  if (modality === 'Salao') {
    destInfo = `<strong>Modalidade:</strong> Salão (Mesa ${mesaInput.value})`;
  } else if (modality === 'Entrega') {
    const deliveryFee = parseFloat(document.getElementById('deliveryFeeInput').value) || 7.00;
    const distanciaText = document.getElementById('distanciaInfo').innerText || "";
    
    const ruaBairro = addressInput.value.trim();
    const numero = numeroInput.value.trim();
    const complementoInput = document.getElementById('complementoInput');
    const complemento = complementoInput ? complementoInput.value.trim() : '';
    enderecoCompleto = `${ruaBairro}, Nº ${numero}${complemento ? ' - ' + complemento : ''}`;

    destInfo = `<strong>Modalidade:</strong> Entrega<br><strong>Endereço:</strong> ${enderecoCompleto}<br><strong>Taxa de Frete:</strong> R$ ${deliveryFee.toFixed(2).replace('.', ',')} ${distanciaText}`;
  }

  const novoPedido = {
    id: Date.now(),
    cliente: clienteAtual ? (clienteAtual.nome || clienteAtual.name) : 'Cliente Balcão',
    telefone: clienteAtual ? (clienteAtual.telefone || clienteAtual.phone) : '',
    endereco: enderecoCompleto,
    mesa: modality === 'Salao' ? mesaInput.value : null,
    tipo: modality,
    status: 'pending', // Importante: O KDS lê 'pending' para colocar na Fila
    itens: orderItems,
    total: totalAmount,
    formaPagamento: paymentMethod,
    detalhesPagamento: payInfo,
    dataHora: new Date().toISOString()
  };

  // ==========================================
  // INTEGRAÇÃO COM A TELA 4 (COZINHA)
  // ==========================================
  // Puxa a lista atual da cozinha, adiciona o novo pedido e salva novamente
  let pedidosDaCozinha = JSON.parse(localStorage.getItem('bellaMassa_pedidos') || '[]');
  pedidosDaCozinha.push(novoPedido);
  localStorage.setItem('bellaMassa_pedidos', JSON.stringify(pedidosDaCozinha));
  
  // Dispara um evento nativo para avisar a outra aba (opcional para alguns navegadores, mas garante funcionamento)
  window.dispatchEvent(new Event('storage'));
  // ==========================================

  // (Mantenha o restante do código que abre o receiptModal e zera os campos abaixo...)

  try {
    if (typeof DB !== 'undefined' && typeof DB.salvarPedido === 'function') {
      DB.salvarPedido(novoPedido);
    }
  } catch (error) {
    console.error("Aviso: O pedido foi gerado na tela, mas houve erro no banco de dados.", error);
  }

  const receiptDetails = document.getElementById('receiptDetails');
  if (receiptDetails) {
    receiptDetails.innerHTML = `
      ${destInfo}<br><br>
      <strong>Itens do Pedido:</strong><br>
      ${itemsListHTML}<br><br>
      <strong>Forma de Pagamento:</strong> ${payInfo}<br><br>
      <strong>Valor Total:</strong> R$ ${totalAmount.toFixed(2).replace('.', ',')}
    `;
  }

  const receiptModal = document.getElementById('receiptModal');
  if (receiptModal) receiptModal.classList.remove('hidden');

  orderItems = [];
  sessionCounter++;

  const counterEl = document.getElementById('counter');
  if (counterEl) counterEl.innerText = sessionCounter;

  localStorage.removeItem('bellaMassa_items');
  localStorage.setItem('bellaMassa_counter', sessionCounter.toString());

  renderOrder();
  resetFields();
}

function imprimirPedidoPDF() {
  const vlibrasEl = document.querySelector('[vw]');
  const previousDisplay = vlibrasEl ? vlibrasEl.style.display : null;

  if (vlibrasEl) vlibrasEl.style.display = 'none';

  const restoreVlibras = () => {
    if (vlibrasEl) vlibrasEl.style.display = previousDisplay || '';
    window.removeEventListener('afterprint', restoreVlibras);
  };

  window.addEventListener('afterprint', restoreVlibras);
  setTimeout(restoreVlibras, 1500);
  window.print();
}

function closeModal() {
  const receiptModal = document.getElementById('receiptModal');
  if (receiptModal) receiptModal.classList.add('hidden');
}

function resetFields() {
  const modalityBalcao = document.querySelector('input[name="modality"][value="Balcao"]');
  if (modalityBalcao) modalityBalcao.checked = true;
  
  const mesaInput = document.getElementById('mesaInput');
  if (mesaInput) mesaInput.value = '';
  
  const cepInput = document.getElementById('cepInput');
  if (cepInput) cepInput.value = '';
  
  const addressInput = document.getElementById('addressInput');
  if (addressInput) addressInput.value = '';

  const numeroInput = document.getElementById('numeroInput');
  if (numeroInput) numeroInput.value = '';

  const complementoInput = document.getElementById('complementoInput');
  if (complementoInput) complementoInput.value = '';

  const feeInput = document.getElementById('deliveryFeeInput');
  if (feeInput) feeInput.value = '7.00';
  
  const distanciaInfo = document.getElementById('distanciaInfo');
  if (distanciaInfo) distanciaInfo.innerText = '';
  
  const mapsLink = document.getElementById('mapsLink');
  if (mapsLink) mapsLink.style.display = 'none';
  
  const catSalgada = document.querySelector('input[name="category"][value="pizza_salgada"]');
  if (catSalgada) catSalgada.checked = true;
  
  const sizeSelect = document.getElementById('sizeSelect');
  if (sizeSelect) sizeSelect.value = "Selecione"; 
  
  const divInteira = document.querySelector('input[name="pizzaTypeDivision"][value="inteira"]');
  if (divInteira) divInteira.checked = true;
  
  const f1 = document.getElementById('flavor1Select');
  if (f1) f1.value = "";
  
  const f2 = document.getElementById('flavor2Select');
  if (f2) f2.value = "Nenhum";
  
  const drinkSelect = document.getElementById('drinkSelect');
  if (drinkSelect) drinkSelect.value = "";
  
  const borderSelect = document.getElementById('borderSelect');
  if (borderSelect) borderSelect.value = "Sem Borda";
  
  const obsInput = document.getElementById('obsInput');
  if (obsInput) obsInput.value = '';
  
  const quantityInput = document.getElementById('quantityInput');
  if (quantityInput) quantityInput.value = 1;
  
  const payCredito = document.querySelector('input[name="paymentMethod"][value="Cartão de Crédito"]');
  if (payCredito) payCredito.checked = true;
  
  const cashAmountInput = document.getElementById('cashAmountInput');
  if (cashAmountInput) cashAmountInput.value = '';
  
  const changeDisplay = document.getElementById('changeDisplay');
  if (changeDisplay) changeDisplay.innerText = 'Troco: R$ 0,00';
  
  toggleModalityFields();
  handleCategoryChange();
  toggleCashFields();
}

async function buscarCEP(cep) {
  cep = cep.replace(/\D/g, '');
  if (cep !== "") {
    let validacep = /^[0-9]{8}$/;
    if (validacep.test(cep)) {
      document.getElementById('addressInput').value = 'Buscando endereço e calculando frete...';
      try {
        const responseCep = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dataCep = await responseCep.json();

        if (!dataCep.erro) {
          const enderecoCompleto = `${dataCep.logradouro}, ${dataCep.bairro}, ${dataCep.localidade} - ${dataCep.uf}`;
          document.getElementById('addressInput').value = enderecoCompleto;
          
          const numeroInput = document.getElementById('numeroInput');
          if (numeroInput) numeroInput.focus();
          
          const mapsLink = document.getElementById('mapsLink');
          if (mapsLink) {
            mapsLink.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(enderecoCompleto)}`;
            mapsLink.style.display = 'inline-block';
          }

          await calcularFretePorDistancia(enderecoCompleto);

        } else {
          mostrarModalErro("CEP não encontrado.", document.getElementById('cepInput'));
          document.getElementById('addressInput').value = '';
        }
      } catch (error) {
        console.error('Erro ao processar o CEP:', error);
        mostrarModalErro('Erro ao buscar o CEP.', document.getElementById('cepInput'));
        document.getElementById('addressInput').value = '';
      }
    } else {
      mostrarModalErro("Formato de CEP inválido.", document.getElementById('cepInput'));
    }
  }
}

async function getCoordenadas(endereco) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'BellaMassaApp' } });
  const data = await res.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  }
  return null;
}

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function calcularFretePorDistancia(enderecoDestino) {
  try {
    const coordsOrigem = await getCoordenadas(PIZZARIA_ORIGEM);
    const coordsDestino = await getCoordenadas(enderecoDestino);

    if (coordsOrigem && coordsDestino) {
      const distanciaLinhaReta = calcularDistanciaKm(coordsOrigem.lat, coordsOrigem.lon, coordsDestino.lat, coordsDestino.lon);
      const distanciaRealKm = distanciaLinhaReta * 1.3;

      const taxaCalculada = 7.00 + (distanciaRealKm * 1.50);
      const taxaFinal = Math.max(7.00, taxaCalculada);

      document.getElementById('deliveryFeeInput').value = taxaFinal.toFixed(2);
      document.getElementById('distanciaInfo').innerText = `(Distância aprox: ${distanciaRealKm.toFixed(1)} km)`;
      renderOrder();
    }
  } catch (e) {
    console.error("Erro ao calcular distância:", e);
    document.getElementById('deliveryFeeInput').value = "7.00";
    renderOrder();
  }
}

// Mapeamento global de funções
window.toggleModalityFields = toggleModalityFields;
window.handleCategoryChange = handleCategoryChange;
window.updatePizzaFlavorPrices = updatePizzaFlavorPrices;
window.togglePizzaDivision = togglePizzaDivision;
window.toggleCashFields = toggleCashFields;
window.calculateChange = calculateChange;
window.addItem = addItem;
window.updateQty = updateQty;
window.removeItem = removeItem;
window.confirmOrder = confirmOrder;
window.closeModal = closeModal;
window.closeValidationModal = closeValidationModal;
window.buscarCEP = buscarCEP;
window.imprimirPedidoPDF = imprimirPedidoPDF;