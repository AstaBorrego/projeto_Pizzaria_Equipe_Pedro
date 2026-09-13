/* ==========================================
   BELLA MASSA
   US-007 - CAIXA E OPERAÇÕES FINANCEIRAS
   ========================================== */

// Listener para postMessage
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

let pedidos = [];
let saldoInicial = 100;
let totalEntradas = 0;
let totalSaidas = 0;

let pagamentos = {
    PIX: 0,
    Credito: 0,
    Debito: 0,
    Dinheiro: 0
};

let pedidoAtual = null;
let tipoMovimentacao = "";

/* ==========================================
   INICIALIZAÇÃO & LEITURA BANCO (READ)
   ========================================== */
window.onload = function () {
    carregarTema();
    carregarPedidosCaixa();
};

function carregarPedidosCaixa() {
    let dbPedidos = [];
    if (typeof DB !== 'undefined') {
        dbPedidos = DB.getPedidos();
    } else {
        dbPedidos = JSON.parse(localStorage.getItem('bellaMassa_pedidos') || '[]');
    }

    // Filtra apenas pedidos que ainda não foram pagos/finalizados no caixa
    pedidos = dbPedidos.filter(p => p.status !== 'paid' && p.status !== 'closed').map(p => ({
        id: p.id,
        cliente: p.cliente || 'Cliente Balcão',
        modalidade: p.tipo === 'Salao' ? `🪑 Mesa ${p.mesa || '01'}` : p.tipo === 'Entrega' ? '🛵 Delivery' : '🍕 Balcão',
        total: parseFloat(p.total) || 0,
        origem: p
    }));

    renderTabelaPedidos();
    atualizarDashboard();
}

function renderTabelaPedidos() {
    const tbody = document.getElementById("pedidosBody");
    if (!tbody) return;

    if (pedidos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Nenhum pedido aguardando pagamento.</td></tr>`;
        return;
    }

    tbody.innerHTML = pedidos.map(p => `
        <tr>
            <td><strong>#${String(p.id).slice(-4)}</strong></td>
            <td>${p.cliente}</td>
            <td>${p.modalidade}</td>
            <td>${moeda(p.total)}</td>
            <td><span class="status-pendente">Pendente</span></td>
            <td>
                <button class="btn-small" onclick="abrirPagamento('${p.id}')">💳 Pagar</button>
            </td>
        </tr>
    `).join('');
}

// Sincronização em tempo real do banco de dados
window.addEventListener('db:pedidosUpdated', carregarPedidosCaixa);
window.addEventListener('db:externalChange', (e) => {
  if (e.detail && e.detail.key === 'bellaMassa_pedidos') carregarPedidosCaixa();
});

/* ==========================================
   ALTERNÂNCIA DE TEMA
   ========================================== */
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

function carregarTema() {
    let tema = localStorage.getItem("bellaMassa_theme") || "dark";
    setTheme(tema);
}

function moeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function atualizarDashboard() {
    let saldoAtual = saldoInicial + totalEntradas - totalSaidas;

    const saldoInicialEl = document.getElementById("saldoInicial");
    if (saldoInicialEl) saldoInicialEl.innerText = moeda(saldoInicial);

    const totalEntradasEl = document.getElementById("totalEntradas");
    if (totalEntradasEl) totalEntradasEl.innerText = moeda(totalEntradas);

    const totalSaidasEl = document.getElementById("totalSaidas");
    if (totalSaidasEl) totalSaidasEl.innerText = moeda(totalSaidas);

    const saldoAtualEl = document.getElementById("saldoAtual");
    if (saldoAtualEl) saldoAtualEl.innerText = moeda(saldoAtual);

    const totalPixEl = document.getElementById("totalPix");
    if (totalPixEl) totalPixEl.innerText = moeda(pagamentos.PIX);

    const totalCreditoEl = document.getElementById("totalCredito");
    if (totalCreditoEl) totalCreditoEl.innerText = moeda(pagamentos.Credito);

    const totalDebitoEl = document.getElementById("totalDebito");
    if (totalDebitoEl) totalDebitoEl.innerText = moeda(pagamentos.Debito);

    const totalDinheiroEl = document.getElementById("totalDinheiro");
    if (totalDinheiroEl) totalDinheiroEl.innerText = moeda(pagamentos.Dinheiro);

    const fechamentoVendasEl = document.getElementById("fechamentoVendas");
    if (fechamentoVendasEl) fechamentoVendasEl.innerText = moeda(totalEntradas);

    let movimentacoes = totalEntradas - totalSaidas;

    const fechamentoMovEl = document.getElementById("fechamentoMovimentacoes");
    if (fechamentoMovEl) fechamentoMovEl.innerText = moeda(movimentacoes);

    const valorEsperadoEl = document.getElementById("valorEsperado");
    if (valorEsperadoEl) valorEsperadoEl.innerText = moeda(saldoAtual);
}

/* ==========================================
   PAGAMENTO E ATUALIZAÇÃO BANCO (UPDATE)
   ========================================== */
function abrirPagamento(id) {
    pedidoAtual = pedidos.find(p => String(p.id) === String(id));

    if (!pedidoAtual) {
        alert("Pedido não encontrado.");
        return;
    }

    document.getElementById("modalPedido").innerText = "#" + String(pedidoAtual.id).slice(-4);
    document.getElementById("modalCliente").innerText = pedidoAtual.cliente;
    document.getElementById("modalTotal").innerText = moeda(pedidoAtual.total);

    document.getElementById("discountInput").value = 0;
    document.getElementById("cashInput").value = "";
    document.getElementById("paymentSelect").value = "PIX";
    document.getElementById("cashPaymentGroup").classList.add("hidden");

    calcularPagamento();
    document.getElementById("paymentModal").classList.remove("hidden");
}

function fecharModalPagamento() {
    document.getElementById("paymentModal").classList.add("hidden");
}

function alternarDinheiro() {
    let metodo = document.getElementById("paymentSelect").value;
    let grupo = document.getElementById("cashPaymentGroup");

    if (metodo === "Dinheiro") {
        grupo.classList.remove("hidden");
    } else {
        grupo.classList.add("hidden");
    }

    calcularPagamento();
}

function calcularPagamento() {
    if (!pedidoAtual) return;

    let desconto = parseFloat(document.getElementById("discountInput").value) || 0;
    if (desconto < 0) desconto = 0;
    if (desconto > pedidoAtual.total) desconto = pedidoAtual.total;

    let total = pedidoAtual.total - desconto;
    document.getElementById("paymentFinalValue").innerText = moeda(total);

    let metodo = document.getElementById("paymentSelect").value;

    if (metodo === "Dinheiro") {
        let recebido = parseFloat(document.getElementById("cashInput").value) || 0;
        let troco = recebido - total;
        let changeInfo = document.getElementById("changeInfo");

        if (recebido === 0) {
            changeInfo.innerText = "Troco: R$ 0,00";
            changeInfo.style.color = "#FFB300";
        } else if (troco >= 0) {
            changeInfo.innerText = "Troco: " + moeda(troco);
            changeInfo.style.color = "#81C784";
        } else {
            changeInfo.innerText = "Faltam: " + moeda(Math.abs(troco));
            changeInfo.style.color = "#EF5350";
        }
    }
}

function confirmarPagamento() {
    if (!pedidoAtual) return;

    let desconto = parseFloat(document.getElementById("discountInput").value) || 0;
    let total = pedidoAtual.total - desconto;
    let metodo = document.getElementById("paymentSelect").value;

    if (metodo === "Dinheiro") {
        let recebido = parseFloat(document.getElementById("cashInput").value) || 0;
        if (recebido < total) {
            alert("O valor recebido é menor que o total do pedido.");
            return;
        }
    }

    totalEntradas += total;
    pagamentos[metodo] += total;

    let agora = new Date();
    let hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    let historico = document.getElementById("historicoBody");
    let nomeMetodo = obterNomeMetodo(metodo);

    let novaLinha = document.createElement("tr");
    novaLinha.innerHTML = `
        <td>${hora}</td>
        <td><span class="tag entrada">Entrada</span></td>
        <td>Pedido #${String(pedidoAtual.id).slice(-4)} - ${nomeMetodo}</td>
        <td class="valor-entrada">+ ${moeda(total)}</td>
    `;

    historico.prepend(novaLinha);
    gerarComprovante(total, desconto, metodo);

    // Atualiza status no Banco de Dados DB Central
    if (typeof DB !== 'undefined') {
        DB.atualizarStatusPedido(pedidoAtual.id, 'paid');
    }

    carregarPedidosCaixa();
    fecharModalPagamento();
    document.getElementById("receiptModal").classList.remove("hidden");
}

function obterNomeMetodo(metodo) {
    if (metodo === "PIX") return "PIX";
    if (metodo === "Credito") return "Cartão de Crédito";
    if (metodo === "Debito") return "Cartão de Débito";
    if (metodo === "Dinheiro") return "Dinheiro";
    return metodo;
}

function gerarComprovante(total, desconto, metodo) {
    let recebido = parseFloat(document.getElementById("cashInput").value) || 0;
    let troco = recebido - total;
    let textoTroco = "";

    if (metodo === "Dinheiro") {
        textoTroco = `
            <p>Valor recebido: <strong>${moeda(recebido)}</strong></p>
            <p>Troco: <strong>${moeda(troco)}</strong></p>
        `;
    }

    document.getElementById("receiptContent").innerHTML = `
        <p><strong>Pedido:</strong> #${String(pedidoAtual.id).slice(-4)}</p>
        <p><strong>Cliente:</strong> ${pedidoAtual.cliente}</p>
        <p><strong>Modalidade:</strong> ${pedidoAtual.modalidade}</p>
        <hr>
        <p>Valor original: ${moeda(pedidoAtual.total)}</p>
        <p>Desconto: ${moeda(desconto)}</p>
        <p>Forma de pagamento: ${obterNomeMetodo(metodo)}</p>
        ${textoTroco}
        <hr>
        <p><strong>Total pago:</strong> ${moeda(total)}</p>
        <p>Obrigado pela preferência!</p>
    `;
}

function fecharComprovante() {
    document.getElementById("receiptModal").classList.add("hidden");
}

function abrirMovimentacao(tipo) {
    tipoMovimentacao = tipo;
    let titulo = document.getElementById("movementTitle");

    if (tipo === "sangria") {
        titulo.innerText = "💸 Registrar Sangria";
    } else {
        titulo.innerText = "💰 Registrar Reforço";
    }

    document.getElementById("movementValue").value = "";
    document.getElementById("movementReason").value = "";
    document.getElementById("movementModal").classList.remove("hidden");
}

function fecharMovimentacao() {
    document.getElementById("movementModal").classList.add("hidden");
}

function confirmarMovimentacao() {
    let valor = parseFloat(document.getElementById("movementValue").value);
    let motivo = document.getElementById("movementReason").value.trim();

    if (!valor || valor <= 0) {
        alert("Informe um valor válido.");
        return;
    }

    if (!motivo) {
        alert("Informe o motivo da operação.");
        return;
    }

    let agora = new Date();
    let hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    let historico = document.getElementById("historicoBody");
    let linha = document.createElement("tr");

    if (tipoMovimentacao === "sangria") {
        totalSaidas += valor;
        linha.innerHTML = `
            <td>${hora}</td>
            <td><span class="tag saida">Saída</span></td>
            <td>Sangria - ${motivo}</td>
            <td class="valor-saida">- ${moeda(valor)}</td>
        `;
    } else {
        totalEntradas += valor;
        linha.innerHTML = `
            <td>${hora}</td>
            <td><span class="tag entrada">Entrada</span></td>
            <td>Reforço - ${motivo}</td>
            <td class="valor-entrada">+ ${moeda(valor)}</td>
        `;
    }

    historico.prepend(linha);
    atualizarDashboard();
    fecharMovimentacao();
}

function fecharCaixa() {
    let saldo = saldoInicial + totalEntradas - totalSaidas;

    let confirmar = confirm(
        "Deseja realmente fechar o caixa?\n\n" +
        "Valor esperado: " + moeda(saldo)
    );

    if (!confirmar) return;

    alert("Caixa fechado com sucesso!\n\nValor final: " + moeda(saldo));

    let status = document.getElementById("caixaStatusBadge");
    if (status) {
        status.innerText = "● Caixa Fechado";
        status.style.background = "#555";
    }

    const btnClose = document.querySelector(".btn-close");
    if (btnClose) {
        btnClose.disabled = true;
        btnClose.innerText = "🔒 Caixa Fechado";
    }
}

// Globalização das funções para chamadas em atributos inline
window.setTheme = setTheme;
window.abrirPagamento = abrirPagamento;
window.fecharModalPagamento = fecharModalPagamento;
window.alternarDinheiro = alternarDinheiro;
window.calcularPagamento = calcularPagamento;
window.confirmarPagamento = confirmarPagamento;
window.fecharComprovante = fecharComprovante;
window.abrirMovimentacao = abrirMovimentacao;
window.fecharMovimentacao = fecharMovimentacao;
window.confirmarMovimentacao = confirmarMovimentacao;
window.fecharCaixa = fecharCaixa;