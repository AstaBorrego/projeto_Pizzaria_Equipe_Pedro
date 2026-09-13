// Escuta postMessage para receber dados do cliente (CRM)
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

const DEFAULT_SETTINGS = {
  tamanhos: {
    broto: 0.70,
    media: 0.85,
    grande: 1.00,
    familia: 1.20
  },
  bordas: {
    semBorda: 0.00,
    catupiry: 8.00,
    cheddar: 8.00,
    chocolate: 10.00
  },
  meioAMeio: "maior"
};

let settings = loadSettings();

window.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  loadFields();
  calculateExample();
});

function loadSettings() {
  const saved = localStorage.getItem("bellaMassa_precos");
  if (!saved) {
    return structuredClone(DEFAULT_SETTINGS);
  }
  try {
    const parsed = JSON.parse(saved);
    return {
      tamanhos: {
        ...DEFAULT_SETTINGS.tamanhos,
        ...(parsed.tamanhos || {})
      },
      bordas: {
        ...DEFAULT_SETTINGS.bordas,
        ...(parsed.bordas || {})
      },
      meioAMeio: parsed.meioAMeio || DEFAULT_SETTINGS.meioAMeio
    };
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
    return structuredClone(DEFAULT_SETTINGS);
  }
}

function loadFields() {
  const brotoEl = document.getElementById("broto");
  if (brotoEl) brotoEl.value = settings.tamanhos.broto.toFixed(2);

  const mediaEl = document.getElementById("media");
  if (mediaEl) mediaEl.value = settings.tamanhos.media.toFixed(2);

  const grandeEl = document.getElementById("grande");
  if (grandeEl) grandeEl.value = settings.tamanhos.grande.toFixed(2);

  const familiaEl = document.getElementById("familia");
  if (familiaEl) familiaEl.value = settings.tamanhos.familia.toFixed(2);

  const semBordaEl = document.getElementById("semBorda");
  if (semBordaEl) semBordaEl.value = settings.bordas.semBorda.toFixed(2);

  const catupiryEl = document.getElementById("catupiry");
  if (catupiryEl) catupiryEl.value = settings.bordas.catupiry.toFixed(2);

  const cheddarEl = document.getElementById("cheddar");
  if (cheddarEl) cheddarEl.value = settings.bordas.cheddar.toFixed(2);

  const chocolateEl = document.getElementById("chocolate");
  if (chocolateEl) chocolateEl.value = settings.bordas.chocolate.toFixed(2);

  const selectedRule = document.querySelector(`input[name="meioAMeio"][value="${settings.meioAMeio}"]`);
  if (selectedRule) {
    selectedRule.checked = true;
  }
}

function getNumber(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const value = parseFloat(el.value);
  if (Number.isNaN(value) || value < 0) {
    return 0;
  }
  return value;
}

function saveSettings() {
  const selectedRule = document.querySelector('input[name="meioAMeio"]:checked');
  settings = {
    tamanhos: {
      broto: getNumber("broto"),
      media: getNumber("media"),
      grande: getNumber("grande"),
      familia: getNumber("familia")
    },
    bordas: {
      semBorda: getNumber("semBorda"),
      catupiry: getNumber("catupiry"),
      cheddar: getNumber("cheddar"),
      chocolate: getNumber("chocolate")
    },
    meioAMeio: selectedRule ? selectedRule.value : "maior"
  };

  localStorage.setItem("bellaMassa_precos", JSON.stringify(settings));
  calculateExample();
  showMessage("✓ Configurações salvas com sucesso!");
}

function resetDefaults() {
  const confirmed = confirm("Deseja realmente restaurar todas as configurações padrão?");
  if (!confirmed) return;

  settings = structuredClone(DEFAULT_SETTINGS);
  localStorage.setItem("bellaMassa_precos", JSON.stringify(settings));
  loadFields();
  calculateExample();
  showMessage("↺ Configurações restauradas para os valores padrão.");
}

function calculateExample() {
  const exampleBase = document.getElementById("exampleBase");
  const exampleSize = document.getElementById("exampleSize");
  const exampleBorder = document.getElementById("exampleBorder");
  if (!exampleBase || !exampleSize || !exampleBorder) return;

  const base = parseFloat(exampleBase.value) || 0;
  const size = exampleSize.value;
  const border = exampleBorder.value;

  const multiplier = settings.tamanhos[size] || 1;
  const borderPrice = settings.bordas[border] || 0;

  const pizzaPrice = base * multiplier;
  const total = pizzaPrice + borderPrice;

  const resBase = document.getElementById("resultBase");
  if (resBase) resBase.textContent = formatMoney(base);

  const resMult = document.getElementById("resultMultiplier");
  if (resMult) resMult.textContent = multiplier.toFixed(2).replace(".", ",") + "x";

  const resBorder = document.getElementById("resultBorder");
  if (resBorder) resBorder.textContent = formatMoney(borderPrice);

  const resTotal = document.getElementById("resultTotal");
  if (resTotal) resTotal.textContent = formatMoney(total);
}

function calculateHalfAndHalf(price1, price2) {
  switch (settings.meioAMeio) {
    case "media":
      return (price1 + price2) / 2;
    case "metade":
      return (price1 * 0.5) + (price2 * 0.5);
    case "menor":
      return Math.min(price1, price2);
    case "maior":
    default:
      return Math.max(price1, price2);
  }
}

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

// ==========================================
// ALTERNÂNCIA DE TEMA (CLAREAR / ESCURECER)
// ==========================================
function setTheme(mode) {
  const btnLight = document.getElementById('btnLight') || document.getElementById('btn-light');
  const btnDark = document.getElementById('btnDark') || document.getElementById('btn-dark');

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
  const element = document.getElementById("statusMessage");
  if (!element) return;

  element.textContent = message;
  element.classList.remove("hidden");

  clearTimeout(showMessage.timeout);
  showMessage.timeout = setTimeout(() => {
    element.classList.add("hidden");
  }, 3000);
}

// Expor funções globais para manipulação de eventos no HTML
window.setTheme = setTheme;
window.saveSettings = saveSettings;
window.resetDefaults = resetDefaults;
window.calculateExample = calculateExample;