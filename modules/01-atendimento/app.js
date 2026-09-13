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

// Base de Dados dos Produtos
const MENU_DATA = {
  pizzas: [
    { name: "Pizza Calabresa", price: 45.00 },
    { name: "Pizza 4 Queijos", price: 50.00 },
    { name: "Pizza Frango c/ Catupiry", price: 48.00 },
    { name: "Pizza Portuguesa", price: 48.00 },
    { name: "Pizza Marguerita", price: 42.00 },
    { name: "Pizza Pepperoni", price: 52.00 },
    { name: "Pizza Chocolate c/ Morango", price: 46.00 },
    { name: "Pizza Romeu e Julieta", price: 44.00 }
  ],
  bebidas: [
    { name: "Coca-Cola 2L", price: 12.00 },
    { name: "Guaraná Antarctica 2L", price: 10.00 },
    { name: "Suco Natural de Laranja 1L", price: 14.00 },
    { name: "Água Mineral 500ml", price: 4.00 },
    { name: "Cerveja Heineken Long Neck", price: 9.00 }
  ],
  bordas: [
    { name: "Sem Borda", price: 0.00 },
    { name: "Catupiry", price: 8.00 },
    { name: "Cheddar", price: 8.00 },
    { name: "Chocolate", price: 10.00 }
  ]
};

// Endereço base da Pizzaria ajustado para o CEP 07043-000
const PIZZARIA_ORIGEM = "07043-000, Brasil";

// Estado do Pedido (Sessão sempre inicia zerada ao abrir/recarregar a tela)
let orderItems = JSON.parse(localStorage.getItem('bellaMassa_items')) || [];
let sessionCounter = 0; 
let totalAmount = 0;

// Garante que o localStorage também inicie limpo para a sessão
localStorage.setItem('bellaMassa_counter', '0');

window.onload = function() {
  // Carregar tema salvo
  const savedTheme = localStorage.getItem('bellaMassa_theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  }

  populateSelects();
  handleCategoryChange();
  document.getElementById('counter').innerText = sessionCounter;
  renderOrder();
  resetFields(); // Limpa e posiciona o cursor ao acessar pela primeira vez
};

// Função para Alternar Tema (Clarear / Escurecer)
function setTheme(mode) {
  const body = document.body;
  if (mode === 'light') {
    body.classList.add('light-theme');
    localStorage.setItem('bellaMassa_theme', 'light');
  } else {
    body.classList.remove('light-theme');
    localStorage.setItem('bellaMassa_theme', 'dark');
  }
}

function saveToLocalStorage() {
  localStorage.setItem('bellaMassa_items', JSON.stringify(orderItems));
  localStorage.setItem('bellaMassa_counter', sessionCounter.toString());
}

function updatePizzaFlavorPrices() {
  const sizeSelect = document.getElementById('sizeSelect');
  const sizeRatio = sizeSelect.value ? parseFloat(sizeSelect.options[sizeSelect.selectedIndex].dataset.ratio) : 1.00;

  const f1 = document.getElementById('flavor1Select');
  const f2 = document.getElementById('flavor2Select');

  const currentF1 = f1.value;
  const currentF2 = f2.value;

  f1.innerHTML = '<option value="">Selecione</option>';
  f2.innerHTML = '<option value="Nenhum">Selecione</option>';

  MENU_DATA.pizzas.forEach(p => {
    const calculatedPrice = p.price * sizeRatio;
    const priceText = `R$ ${calculatedPrice.toFixed(2).replace('.', ',')}`;

    f1.add(new Option(`${p.name} - ${priceText}`, p.name));
    f2.add(new Option(`${p.name} - ${priceText}`, p.name));
  });

  if (currentF1) f1.value = currentF1;
  if (currentF2) f2.value = currentF2;
}

function populateSelects() {
  const drink = document.getElementById('drinkSelect');
  if (drink) {
    drink.innerHTML = '<option value="">Selecione</option>';
    MENU_DATA.bebidas.forEach(b => {
      drink.add(new Option(`${b.name} - R$ ${b.price.toFixed(2).replace('.', ',')}`, b.name));
    });
  }

  const border = document.getElementById('borderSelect');
  if (border) {
    border.innerHTML = '<option value="">Selecione</option>';
    MENU_DATA.bordas.forEach(b => {
      border.add(new Option(`${b.name} - R$ ${b.price.toFixed(2).replace('.', ',')}`, b.name));
    });
  }

  updatePizzaFlavorPrices();
}

function handleCategoryChange() {
  const catVal = document.getElementById('category').value;
  const isPizza = catVal === 'pizza';
  document.getElementById('sizeGroup').classList.toggle('hidden', !isPizza && catVal !== '');
  document.getElementById('pizzaFlavorsGroup').classList.toggle('hidden', !isPizza && catVal !== '');
  document.getElementById('borderGroup').classList.toggle('hidden', !isPizza && catVal !== '');
  document.getElementById('drinkGroup').classList.toggle('hidden', catVal !== 'bebida');

  if (isPizza) {
    updatePizzaFlavorPrices();
  }
}

function toggleModalityFields() {
  const modality = document.getElementById('modality').value;
  const mesaGroup = document.getElementById('mesaGroup');
  const deliveryGroup = document.getElementById('deliveryGroup');

  if (modality === 'Salao') {
    mesaGroup.classList.remove('hidden');
    mesaGroup.style.display = 'block';
  } else {
    mesaGroup.classList.add('hidden');
    mesaGroup.style.display = 'none';
  }

  if (modality === 'Entrega') {
    deliveryGroup.classList.remove('hidden');
    deliveryGroup.style.display = 'block';
  } else {
    deliveryGroup.classList.add('hidden');
    deliveryGroup.style.display = 'none';
  }

  renderOrder();
}

function toggleCashFields() {
  const method = document.getElementById('paymentMethod').value;
  const cashGroup = document.getElementById('cashGroup');
  if (method === 'Dinheiro') {
    cashGroup.classList.remove('hidden');
    cashGroup.style.display = 'block';
  } else {
    cashGroup.classList.add('hidden');
    cashGroup.style.display = 'none';
  }
}

function calculateChange() {
  const cash = parseFloat(document.getElementById('cashAmountInput').value) || 0;
  const change = cash - totalAmount;
  const changeDisplay = document.getElementById('changeDisplay');

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
  const modality = document.getElementById('modality').value;
  const category = document.getElementById('category').value;

  if (!modality) {
    alert('Por favor, selecione a Modalidade de Atendimento!');
    document.getElementById('modality').focus();
    return;
  }

  if (!category) {
    alert('Por favor, selecione a Categoria do Item!');
    document.getElementById('category').focus();
    return;
  }

  const quantityInput = document.getElementById('quantityInput');
  const quantity = parseInt(quantityInput.value, 10);
  const obs = document.getElementById('obsInput').value.trim();

  if (isNaN(quantity) || quantity <= 0) {
    alert('Por favor, informe uma quantidade válida (mínimo 1)!');
    quantityInput.value = 1;
    return;
  }

  let itemData = {};

  if (category === 'pizza') {
    const sizeSelect = document.getElementById('sizeSelect');
    if (!sizeSelect.value) {
      alert('Por favor, selecione o Tamanho da Pizza!');
      sizeSelect.focus();
      return;
    }
    const sizeName = sizeSelect.value;
    const sizeRatio = parseFloat(sizeSelect.options[sizeSelect.selectedIndex].dataset.ratio);

    const f1Select = document.getElementById('flavor1Select');
    if (!f1Select.value) {
      alert('Por favor, selecione o Sabor 1!');
      f1Select.focus();
      return;
    }
    const f1Name = f1Select.value;
    const f2Name = document.getElementById('flavor2Select').value;

    const f1Obj = MENU_DATA.pizzas.find(p => p.name === f1Name);
    const f2Obj = f2Name !== "Nenhum" ? MENU_DATA.pizzas.find(p => p.name === f2Name) : null;

    let basePrice = f1Obj.price;
    let desc = f1Name;

    if (f2Obj) {
      basePrice = Math.max(f1Obj.price, f2Obj.price);
      desc = `½ ${f1Name} / ½ ${f2Name}`;
    }

    const borderSelect = document.getElementById('borderSelect');
    if (!borderSelect.value) {
      alert('Por favor, selecione a Borda Recheada!');
      borderSelect.focus();
      return;
    }
    const borderName = borderSelect.value;
    const borderObj = MENU_DATA.bordas.find(b => b.name === borderName);

    const unitPrice = (basePrice * sizeRatio) + borderObj.price;

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
      alert('Por favor, selecione a Bebida!');
      drinkSelect.focus();
      return;
    }
    const drinkName = drinkSelect.value;
    const drinkObj = MENU_DATA.bebidas.find(b => b.name === drinkName);

    itemData = {
      type: 'bebida',
      size: 'N/A',
      product: drinkName,
      flavor1: drinkName,
      flavor2: 'Nenhum',
      border: 'N/A',
      obs: obs,
      unitPrice: drinkObj.price
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
  document.getElementById('obsInput').value = '';

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
  tbody.innerHTML = '';
  let subtotalSum = 0;

  orderItems.forEach((item) => {
    subtotalSum += item.subtotal;
    const row = document.createElement('tr');

    let detailStr = item.border !== 'N/A' ? item.border : '-';
    if (item.obs) detailStr += `<br><small style="color:#666;">Obs: ${item.obs}</small>`;

    let sizeTag = item.size !== 'N/A' ? ` (${item.size})` : '';

    row.innerHTML = `
      <td>
        <button onclick="updateQty(${item.id}, -1)" style="cursor:pointer; font-weight:bold;">-</button>
        <strong>${item.quantity}x</strong>
        <button onclick="updateQty(${item.id}, 1)" style="cursor:pointer; font-weight:bold;">+</button>
        ${item.product}${sizeTag}
      </td>
      <td>${detailStr}</td>
      <td>R$ ${item.subtotal.toFixed(2).replace('.', ',')}</td>
      <td style="text-align: center;">
        <button onclick="removeItem(${item.id})" style="background:none; border:none; color:#D32F2F; cursor:pointer; font-weight:bold;" title="Remover item">❌</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  const modality = document.getElementById('modality').value;
  let deliveryFee = 0;
  
  if (modality === 'Entrega') {
    deliveryFee = parseFloat(document.getElementById('deliveryFeeInput').value) || 7.00;
    
    // Adiciona a linha do frete na tabela de itens
    const rowFee = document.createElement('tr');
    const distanciaText = document.getElementById('distanciaInfo').innerText || "";
    rowFee.innerHTML = `
      <td><strong>1x Taxa de Entrega</strong></td>
      <td>Entrega por distância ${distanciaText}</td>
      <td>R$ ${deliveryFee.toFixed(2).replace('.', ',')}</td>
      <td style="text-align: center;">-</td>
    `;
    tbody.appendChild(rowFee);
  }

  totalAmount = subtotalSum + deliveryFee;
  document.getElementById('totalPrice').innerText = `R$ ${totalAmount.toFixed(2).replace('.', ',')}`;
  calculateChange();
}

function confirmOrder() {
  const modality = document.getElementById('modality').value;
  const paymentMethod = document.getElementById('paymentMethod').value;
  const mesaInput = document.getElementById('mesaInput');
  const addressInput = document.getElementById('addressInput');
  const numeroInput = document.getElementById('numeroInput');
  const complementoInput = document.getElementById('complementoInput');

  if (!modality) {
    alert('Por favor, selecione a Modalidade de Atendimento!');
    document.getElementById('modality').focus();
    return;
  }

  if (modality === 'Salao' && (!mesaInput.value || mesaInput.value <= 0)) {
    alert('Por favor, informe um número de mesa válido!');
    mesaInput.focus();
    return;
  }

  if (modality === 'Entrega') {
    if (!addressInput.value.trim()) {
      alert('Por favor, informe o endereço de entrega!');
      addressInput.focus();
      return;
    }
    if (!numeroInput.value.trim()) {
      alert('Por favor, informe o número do endereço!');
      numeroInput.focus();
      return;
    }
  }

  if (orderItems.length === 0) {
    alert('Adicione ao menos um item ao pedido antes de confirmar!');
    return;
  }

  if (!paymentMethod) {
    alert('Por favor, selecione a Forma de Pagamento!');
    document.getElementById('paymentMethod').focus();
    return;
  }

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
  if (modality === 'Salao') {
    destInfo = `<strong>Modalidade:</strong> Salão (Mesa ${mesaInput.value})`;
  } else if (modality === 'Entrega') {
    const deliveryFee = parseFloat(document.getElementById('deliveryFeeInput').value) || 7.00;
    const distanciaText = document.getElementById('distanciaInfo').innerText || "";
    
    const ruaBairro = addressInput.value.trim();
    const numero = numeroInput.value.trim();
    const complemento = complementoInput.value.trim();
    const enderecoCompleto = `${ruaBairro}, Nº ${numero}${complemento ? ' - ' + complemento : ''}`;

    destInfo = `<strong>Modalidade:</strong> Entrega<br><strong>Endereço:</strong> ${enderecoCompleto}<br><strong>Taxa de Frete:</strong> R$ ${deliveryFee.toFixed(2).replace('.', ',')} ${distanciaText}`;
  }

  const receiptDetails = document.getElementById('receiptDetails');
  receiptDetails.innerHTML = `
    ${destInfo}<br><br>
    <strong>Itens do Pedido:</strong><br>
    ${itemsListHTML}<br><br>
    <strong>Forma de Pagamento:</strong> ${payInfo}<br><br>
    <strong>Valor Total:</strong> R$ ${totalAmount.toFixed(2).replace('.', ',')}
  `;

  // Zera e limpa o contador da sessão instantaneamente ao confirmar/finalizar o pedido
  sessionCounter = 0;
  document.getElementById('counter').innerText = sessionCounter;
  localStorage.setItem('bellaMassa_counter', '0');

  saveToLocalStorage();
  document.getElementById('receiptModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('receiptModal').classList.add('hidden');
  
  // Limpa os itens do pedido e garante a sessão zerada
  orderItems = [];
  sessionCounter = 0;
  document.getElementById('counter').innerText = sessionCounter;
  
  localStorage.removeItem('bellaMassa_items');
  localStorage.setItem('bellaMassa_counter', '0');
  
  renderOrder();
  resetFields(); // Limpa o formulário e posiciona o cursor no primeiro campo
}

function resetFields() {
  document.getElementById('modality').value = "";
  document.getElementById('mesaInput').value = '';
  
  const cepInput = document.getElementById('cepInput');
  if(cepInput) cepInput.value = '';
  
  document.getElementById('addressInput').value = '';

  // Limpeza dos campos de Número e Complemento
  const numeroInput = document.getElementById('numeroInput');
  if(numeroInput) numeroInput.value = '';

  const complementoInput = document.getElementById('complementoInput');
  if(complementoInput) complementoInput.value = '';

  document.getElementById('deliveryFeeInput').value = '7.00';
  
  const distanciaInfo = document.getElementById('distanciaInfo');
  if(distanciaInfo) distanciaInfo.innerText = '';
  
  const mapsLink = document.getElementById('mapsLink');
  if(mapsLink) mapsLink.style.display = 'none';
  
  document.getElementById('category').value = "";
  document.getElementById('sizeSelect').value = "";
  document.getElementById('flavor1Select').value = "";
  document.getElementById('flavor2Select').value = "Nenhum";
  document.getElementById('drinkSelect').value = "";
  document.getElementById('borderSelect').value = "";
  
  document.getElementById('obsInput').value = '';
  document.getElementById('quantityInput').value = 1;
  document.getElementById('paymentMethod').value = "";
  
  const cashAmountInput = document.getElementById('cashAmountInput');
  if(cashAmountInput) cashAmountInput.value = '';
  
  const changeDisplay = document.getElementById('changeDisplay');
  if(changeDisplay) changeDisplay.innerText = 'Troco: R$ 0,00';
  
  toggleModalityFields();
  handleCategoryChange();
  toggleCashFields();
  
  // Posiciona o cursor no primeiro campo da tela ao carregar ou reiniciar
  document.getElementById('modality').focus();
}

async function buscarCEP(cep) {
  cep = cep.replace(/\D/g, '');
  if (cep !== "") {
    let validacep = /^[0-9]{8}$/;
    if(validacep.test(cep)) {
      document.getElementById('addressInput').value = 'Buscando endereço e calculando frete...';
      try {
        const responseCep = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dataCep = await responseCep.json();

        if (!dataCep.erro) {
          const enderecoCompleto = `${dataCep.logradouro}, ${dataCep.bairro}, ${dataCep.localidade} - ${dataCep.uf}`;
          document.getElementById('addressInput').value = enderecoCompleto;
          
          // Foca automaticamente no campo Número após encontrar o endereço pelo CEP
          const numeroInput = document.getElementById('numeroInput');
          if(numeroInput) numeroInput.focus();
          
          const mapsLink = document.getElementById('mapsLink');
          if (mapsLink) {
            mapsLink.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(enderecoCompleto)}`;
            mapsLink.style.display = 'inline-block';
          }

          await calcularFretePorDistancia(enderecoCompleto);

        } else {
          alert("CEP não encontrado.");
          document.getElementById('addressInput').value = '';
        }
      } catch (error) {
        console.error('Erro ao processar o CEP:', error);
        alert('Erro ao buscar o CEP.');
        document.getElementById('addressInput').value = '';
      }
    } else {
      alert("Formato de CEP inválido.");
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