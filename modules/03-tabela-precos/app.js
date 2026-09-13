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

  const saved = localStorage.getItem(
    "bellaMassa_precos"
  );

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

      meioAMeio:
        parsed.meioAMeio ||
        DEFAULT_SETTINGS.meioAMeio
    };

  } catch (error) {

    console.error(
      "Erro ao carregar configurações:",
      error
    );

    return structuredClone(DEFAULT_SETTINGS);
  }
}


function loadFields() {

  document.getElementById("broto").value =
    settings.tamanhos.broto.toFixed(2);

  document.getElementById("media").value =
    settings.tamanhos.media.toFixed(2);

  document.getElementById("grande").value =
    settings.tamanhos.grande.toFixed(2);

  document.getElementById("familia").value =
    settings.tamanhos.familia.toFixed(2);


  document.getElementById("semBorda").value =
    settings.bordas.semBorda.toFixed(2);

  document.getElementById("catupiry").value =
    settings.bordas.catupiry.toFixed(2);

  document.getElementById("cheddar").value =
    settings.bordas.cheddar.toFixed(2);

  document.getElementById("chocolate").value =
    settings.bordas.chocolate.toFixed(2);


  const selectedRule =
    document.querySelector(
      `input[name="meioAMeio"][value="${settings.meioAMeio}"]`
    );

  if (selectedRule) {
    selectedRule.checked = true;
  }

}


function getNumber(id) {

  const value =
    parseFloat(
      document.getElementById(id).value
    );

  if (Number.isNaN(value) || value < 0) {
    return 0;
  }

  return value;
}


function saveSettings() {

  const selectedRule =
    document.querySelector(
      'input[name="meioAMeio"]:checked'
    );


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

    meioAMeio:
      selectedRule
        ? selectedRule.value
        : "maior"
  };


  localStorage.setItem(
    "bellaMassa_precos",
    JSON.stringify(settings)
  );


  calculateExample();

  showMessage(
    "✓ Configurações salvas com sucesso!"
  );

}


function resetDefaults() {

  const confirmed =
    confirm(
      "Deseja realmente restaurar todas as configurações padrão?"
    );


  if (!confirmed) {
    return;
  }


  settings =
    structuredClone(DEFAULT_SETTINGS);


  localStorage.setItem(
    "bellaMassa_precos",
    JSON.stringify(settings)
  );


  loadFields();

  calculateExample();

  showMessage(
    "↺ Configurações restauradas para os valores padrão."
  );

}


function calculateExample() {

  const base =
    parseFloat(
      document.getElementById("exampleBase").value
    ) || 0;


  const size =
    document.getElementById("exampleSize").value;


  const border =
    document.getElementById("exampleBorder").value;


  const multiplier =
    settings.tamanhos[size] || 1;


  const borderPrice =
    settings.bordas[border] || 0;


  const pizzaPrice =
    base * multiplier;


  const total =
    pizzaPrice + borderPrice;


  document.getElementById("resultBase").textContent =
    formatMoney(base);


  document.getElementById("resultMultiplier").textContent =
    multiplier.toFixed(2).replace(".", ",") + "x";


  document.getElementById("resultBorder").textContent =
    formatMoney(borderPrice);


  document.getElementById("resultTotal").textContent =
    formatMoney(total);

}


function calculateHalfAndHalf(price1, price2) {

  switch (settings.meioAMeio) {

    case "media":

      return (price1 + price2) / 2;


    case "metade":

      return (price1 * 0.5) +
             (price2 * 0.5);


    case "menor":

      return Math.min(
        price1,
        price2
      );


    case "maior":

    default:

      return Math.max(
        price1,
        price2
      );
  }

}


function formatMoney(value) {

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  ).format(value);

}


function setTheme(mode) {

  if (mode === "light") {

    document.body.classList.add(
      "light-theme"
    );

    localStorage.setItem(
      "bellaMassa_theme",
      "light"
    );

  } else {

    document.body.classList.remove(
      "light-theme"
    );

    localStorage.setItem(
      "bellaMassa_theme",
      "dark"
    );

  }

}


function loadTheme() {

  const theme =
    localStorage.getItem(
      "bellaMassa_theme"
    );


  if (theme === "light") {

    document.body.classList.add(
      "light-theme"
    );

  }

}


function showMessage(message) {

  const element =
    document.getElementById(
      "statusMessage"
    );


  element.textContent = message;

  element.classList.remove(
    "hidden"
  );


  clearTimeout(
    showMessage.timeout
  );


  showMessage.timeout =
    setTimeout(() => {

      element.classList.add(
        "hidden"
      );

    }, 3000);

}