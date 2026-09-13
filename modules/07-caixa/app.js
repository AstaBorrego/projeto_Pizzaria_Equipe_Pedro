/* ==========================================
   BELLA MASSA
   US-007 - CAIXA E OPERAÇÕES FINANCEIRAS
   ========================================== */

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
/* PEDIDOS SIMULADOS */

let pedidos = [

    {
        id: 1,
        cliente: "João Silva",
        modalidade: "🍕 Balcão",
        total: 58.00
    },

    {
        id: 2,
        cliente: "Maria Oliveira",
        modalidade: "🪑 Mesa 05",
        total: 92.00
    },

    {
        id: 3,
        cliente: "Lucas Santos",
        modalidade: "🛵 Delivery",
        total: 76.50
    }

];


/* DADOS DO CAIXA */

let saldoInicial = 100;

let totalEntradas = 850;

let totalSaidas = 0;


/* VALORES POR PAGAMENTO */

let pagamentos = {

    PIX: 250,

    Credito: 300,

    Debito: 200,

    Dinheiro: 100

};


/* PEDIDO ATUAL */

let pedidoAtual = null;


/* TIPO DE MOVIMENTAÇÃO */

let tipoMovimentacao = "";


/* ==========================================
   INICIALIZAÇÃO
   ========================================== */

window.onload = function () {

    carregarTema();

    atualizarDashboard();

};


/* ==========================================
   FORMATAÇÃO DE MOEDA
   ========================================== */

function moeda(valor) {

    return valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


/* ==========================================
   ATUALIZAR DASHBOARD
   ========================================== */

function atualizarDashboard() {

    let saldoAtual =
        saldoInicial +
        totalEntradas -
        totalSaidas;


    document.getElementById("saldoInicial").innerText =
        moeda(saldoInicial);


    document.getElementById("totalEntradas").innerText =
        moeda(totalEntradas);


    document.getElementById("totalSaidas").innerText =
        moeda(totalSaidas);


    document.getElementById("saldoAtual").innerText =
        moeda(saldoAtual);


    document.getElementById("totalPix").innerText =
        moeda(pagamentos.PIX);


    document.getElementById("totalCredito").innerText =
        moeda(pagamentos.Credito);


    document.getElementById("totalDebito").innerText =
        moeda(pagamentos.Debito);


    document.getElementById("totalDinheiro").innerText =
        moeda(pagamentos.Dinheiro);


    document.getElementById("fechamentoVendas").innerText =
        moeda(totalEntradas);


    let movimentacoes =
        totalEntradas - totalSaidas;


    document.getElementById(
        "fechamentoMovimentacoes"
    ).innerText =
        moeda(movimentacoes);


    document.getElementById("valorEsperado").innerText =
        moeda(saldoAtual);

}


/* ==========================================
   ABRIR PAGAMENTO
   ========================================== */

function abrirPagamento(id) {

    pedidoAtual =
        pedidos.find(
            pedido => pedido.id === id
        );


    if (!pedidoAtual) {

        alert("Pedido não encontrado.");

        return;
    }


    document.getElementById("modalPedido").innerText =
        "#" +
        String(pedidoAtual.id).padStart(3, "0");


    document.getElementById("modalCliente").innerText =
        pedidoAtual.cliente;


    document.getElementById("modalTotal").innerText =
        moeda(pedidoAtual.total);


    document.getElementById("discountInput").value = 0;

    document.getElementById("cashInput").value = "";


    document.getElementById("paymentSelect").value =
        "PIX";


    document.getElementById("cashPaymentGroup")
        .classList.add("hidden");


    calcularPagamento();


    document.getElementById("paymentModal")
        .classList.remove("hidden");

}


/* ==========================================
   FECHAR MODAL PAGAMENTO
   ========================================== */

function fecharModalPagamento() {

    document.getElementById("paymentModal")
        .classList.add("hidden");

}


/* ==========================================
   ALTERNAR DINHEIRO
   ========================================== */

function alternarDinheiro() {

    let metodo =
        document.getElementById("paymentSelect").value;


    let grupo =
        document.getElementById("cashPaymentGroup");


    if (metodo === "Dinheiro") {

        grupo.classList.remove("hidden");

    } else {

        grupo.classList.add("hidden");

    }


    calcularPagamento();

}


/* ==========================================
   CALCULAR PAGAMENTO
   ========================================== */

function calcularPagamento() {

    if (!pedidoAtual) return;


    let desconto =
        parseFloat(
            document.getElementById("discountInput").value
        ) || 0;


    if (desconto < 0) {

        desconto = 0;

    }


    if (desconto > pedidoAtual.total) {

        desconto = pedidoAtual.total;

    }


    let total =
        pedidoAtual.total - desconto;


    document.getElementById(
        "paymentFinalValue"
    ).innerText =
        moeda(total);


    let metodo =
        document.getElementById("paymentSelect").value;


    if (metodo === "Dinheiro") {

        let recebido =
            parseFloat(
                document.getElementById("cashInput").value
            ) || 0;


        let troco =
            recebido - total;


        let changeInfo =
            document.getElementById("changeInfo");


        if (recebido === 0) {

            changeInfo.innerText =
                "Troco: R$ 0,00";

            changeInfo.style.color =
                "#FFB300";

        }

        else if (troco >= 0) {

            changeInfo.innerText =
                "Troco: " +
                moeda(troco);

            changeInfo.style.color =
                "#81C784";

        }

        else {

            changeInfo.innerText =
                "Faltam: " +
                moeda(Math.abs(troco));

            changeInfo.style.color =
                "#EF5350";

        }

    }

}


/* ==========================================
   CONFIRMAR PAGAMENTO
   ========================================== */

function confirmarPagamento() {

    if (!pedidoAtual) return;


    let desconto =
        parseFloat(
            document.getElementById("discountInput").value
        ) || 0;


    let total =
        pedidoAtual.total - desconto;


    let metodo =
        document.getElementById("paymentSelect").value;


    /* VERIFICA DINHEIRO */

    if (metodo === "Dinheiro") {

        let recebido =
            parseFloat(
                document.getElementById("cashInput").value
            ) || 0;


        if (recebido < total) {

            alert(
                "O valor recebido é menor que o total do pedido."
            );

            return;
        }

    }


    /* REGISTRA ENTRADA */

    totalEntradas += total;


    /* REGISTRA FORMA DE PAGAMENTO */

    pagamentos[metodo] += total;


    /* GERA HORÁRIO */

    let agora =
        new Date();


    let hora =
        agora.toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    /* ADICIONA HISTÓRICO */

    let historico =
        document.getElementById(
            "historicoBody"
        );


    let nomeMetodo =
        obterNomeMetodo(metodo);


    let novaLinha =
        document.createElement("tr");


    novaLinha.innerHTML = `

        <td>${hora}</td>

        <td>
            <span class="tag entrada">
                Entrada
            </span>
        </td>

        <td>
            Pedido #${String(pedidoAtual.id).padStart(3, "0")}
            - ${nomeMetodo}
        </td>

        <td class="valor-entrada">
            + ${moeda(total)}
        </td>

    `;


    historico.prepend(novaLinha);


    /* GERA COMPROVANTE */

    gerarComprovante(
        total,
        desconto,
        metodo
    );


    /* REMOVE PEDIDO */

    pedidos =
        pedidos.filter(
            pedido =>
                pedido.id !== pedidoAtual.id
        );


    let linhas =
        document.querySelectorAll(
            "#pedidosBody tr"
        );


    linhas.forEach(
        linha => {

            let botao =
                linha.querySelector(
                    "button"
                );


            if (botao) {

                let texto =
                    botao.getAttribute(
                        "onclick"
                    );


                if (
                    texto &&
                    texto.includes(
                        pedidoAtual.id
                    )
                ) {

                    linha.remove();

                }

            }

        }
    );


    atualizarDashboard();


    fecharModalPagamento();


    document.getElementById(
        "receiptModal"
    ).classList.remove("hidden");

}


/* ==========================================
   NOME DO MÉTODO
   ========================================== */

function obterNomeMetodo(metodo) {

    if (metodo === "PIX") {

        return "PIX";

    }


    if (metodo === "Credito") {

        return "Cartão de Crédito";

    }


    if (metodo === "Debito") {

        return "Cartão de Débito";

    }


    if (metodo === "Dinheiro") {

        return "Dinheiro";

    }


    return metodo;

}


/* ==========================================
   COMPROVANTE
   ========================================== */

function gerarComprovante(
    total,
    desconto,
    metodo
) {

    let recebido =
        parseFloat(
            document.getElementById(
                "cashInput"
            ).value
        ) || 0;


    let troco =
        recebido - total;


    let textoTroco = "";


    if (metodo === "Dinheiro") {

        textoTroco = `

            <p>
                Valor recebido:
                <strong>${moeda(recebido)}</strong>
            </p>

            <p>
                Troco:
                <strong>${moeda(troco)}</strong>
            </p>

        `;

    }


    document.getElementById(
        "receiptContent"
    ).innerHTML = `

        <p>
            <strong>Pedido:</strong>
            #${String(pedidoAtual.id).padStart(3, "0")}
        </p>

        <p>
            <strong>Cliente:</strong>
            ${pedidoAtual.cliente}
        </p>

        <p>
            <strong>Modalidade:</strong>
            ${pedidoAtual.modalidade}
        </p>

        <hr>

        <p>
            Valor original:
            ${moeda(pedidoAtual.total)}
        </p>

        <p>
            Desconto:
            ${moeda(desconto)}
        </p>

        <p>
            Forma de pagamento:
            ${obterNomeMetodo(metodo)}
        </p>

        ${textoTroco}

        <hr>

        <p>
            <strong>Total pago:</strong>
            ${moeda(total)}
        </p>

        <p>
            Obrigado pela preferência!
        </p>

    `;

}


/* ==========================================
   FECHAR COMPROVANTE
   ========================================== */

function fecharComprovante() {

    document.getElementById(
        "receiptModal"
    ).classList.add("hidden");

}


/* ==========================================
   ABRIR SANGRIA / REFORÇO
   ========================================== */

function abrirMovimentacao(tipo) {

    tipoMovimentacao = tipo;


    let titulo =
        document.getElementById(
            "movementTitle"
        );


    if (tipo === "sangria") {

        titulo.innerText =
            "💸 Registrar Sangria";

    } else {

        titulo.innerText =
            "💰 Registrar Reforço";

    }


    document.getElementById(
        "movementValue"
    ).value = "";


    document.getElementById(
        "movementReason"
    ).value = "";


    document.getElementById(
        "movementModal"
    ).classList.remove("hidden");

}


/* ==========================================
   FECHAR MOVIMENTAÇÃO
   ========================================== */

function fecharMovimentacao() {

    document.getElementById(
        "movementModal"
    ).classList.add("hidden");

}


/* ==========================================
   CONFIRMAR SANGRIA / REFORÇO
   ========================================== */

function confirmarMovimentacao() {

    let valor =
        parseFloat(
            document.getElementById(
                "movementValue"
            ).value
        );


    let motivo =
        document.getElementById(
            "movementReason"
        ).value.trim();


    if (!valor || valor <= 0) {

        alert(
            "Informe um valor válido."
        );

        return;
    }


    if (!motivo) {

        alert(
            "Informe o motivo da operação."
        );

        return;
    }


    let agora =
        new Date();


    let hora =
        agora.toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    let historico =
        document.getElementById(
            "historicoBody"
        );


    let linha =
        document.createElement("tr");


    if (tipoMovimentacao === "sangria") {

        totalSaidas += valor;


        linha.innerHTML = `

            <td>${hora}</td>

            <td>
                <span class="tag saida">
                    Saída
                </span>
            </td>

            <td>
                Sangria - ${motivo}
            </td>

            <td class="valor-saida">
                - ${moeda(valor)}
            </td>

        `;

    }

    else {

        totalEntradas += valor;


        linha.innerHTML = `

            <td>${hora}</td>

            <td>
                <span class="tag entrada">
                    Entrada
                </span>
            </td>

            <td>
                Reforço - ${motivo}
            </td>

            <td class="valor-entrada">
                + ${moeda(valor)}
            </td>

        `;

    }


    historico.prepend(linha);


    atualizarDashboard();


    fecharMovimentacao();

}


/* ==========================================
   FECHAR CAIXA
   ========================================== */

function fecharCaixa() {

    let saldo =
        saldoInicial +
        totalEntradas -
        totalSaidas;


    let confirmar =
        confirm(
            "Deseja realmente fechar o caixa?\n\n" +
            "Valor esperado: " +
            moeda(saldo)
        );


    if (!confirmar) {

        return;

    }


    alert(
        "Caixa fechado com sucesso!\n\n" +
        "Valor final: " +
        moeda(saldo)
    );


    let status =
        document.querySelector(
            ".status-badge"
        );


    status.innerText =
        "● Caixa Fechado";


    status.style.background =
        "#555";


    document.querySelector(
        ".btn-close"
    ).disabled = true;


    document.querySelector(
        ".btn-close"
    ).innerText =
        "🔒 Caixa Fechado";

}


/* ==========================================
   TEMA
   ========================================== */

function setTheme(mode) {

    if (mode === "light") {

        document.body.classList.add(
            "light-theme"
        );

        localStorage.setItem(
            "bellaMassaTheme",
            "light"
        );

    }

    else {

        document.body.classList.remove(
            "light-theme"
        );

        localStorage.setItem(
            "bellaMassaTheme",
            "dark"
        );

    }

}


/* ==========================================
   CARREGAR TEMA
   ========================================== */

function carregarTema() {

    let tema =
        localStorage.getItem(
            "bellaMassaTheme"
        );


    if (tema === "light") {

        document.body.classList.add(
            "light-theme"
        );

    }

}