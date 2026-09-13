// Troca de Telas pelos Botões do Menu
const buttons = document.querySelectorAll('.menu-btn');
const iframe = document.getElementById('moduleFrame');

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Altera a origem do iframe sem recarregar a shell
    iframe.src = btn.getAttribute('data-module');
  });
});

/**
 * COMUNICAÇÃO ENTRE MÓDULOS (postMessage)
 * Permite que um script.js de um iframe mande dados para outro.
 * Exemplo: O módulo de Clientes (Tálamo) manda os dados para o Atendimento (Pedro).
 */
window.addEventListener('message', (event) => {
  const { action, data } = event.data;

  if (action === 'SELECT_CUSTOMER_FOR_ORDER') {
    console.log('Cliente selecionado recebido na Shell:', data);
    
    // Troca para a tela do Pedro (Atendimento)
    const atendimentoBtn = document.querySelector('[data-module="modules/01-atendimento/index.html"]');
    atendimentoBtn.click();

    // Aguarda o iframe carregar e passa o cliente cadastrado para ele
    iframe.onload = () => {
      iframe.contentWindow.postMessage({
        action: 'LOAD_CUSTOMER_DATA',
        customer: data
      }, '*');
    };
  }
});
// Dentro do script.js do Módulo 08 (Tálamo)
function selecionarClienteParaPedido(cliente) {
  // Envia a mensagem para o index.html principal (Shell)
  window.parent.postMessage({
    action: 'SELECT_CUSTOMER_FOR_ORDER',
    data: {
      nome: cliente.name,
      telefone: cliente.phone,
      endereco: cliente.street
    }
  }, '*');
}