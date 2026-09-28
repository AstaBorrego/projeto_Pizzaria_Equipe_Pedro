# Projeto Pizzaria - Documentação

## Diagrama de Classes do Sistema

Abaixo está estruturado o diagrama de classes que modela o sistema de comércio eletrônico da pizzaria desenvolvido com HTML, CSS, JavaScript puro e persistência em `localStorage`.

```mermaid
classDiagram
    direction LR

    class Produto {
        +String id
        +String nome
        +Number preco
        +String descricao
        +String categoria
        +String imagem
    }

    class CarrinhoItem {
        +String id
        +Produto produto
        +Number quantidade
        +String tamanho
        +Number subtotal()
    }

    class Pedido {
        +String idPedido
        +Array~CarrinhoItem~ itens
        +Object clienteDados
        +Number valorTotal
        +String data
        +String status
        +finalizarPedido()
    }

    class LocalStorageService {
        +String chave
        +salvar(dados)
        +obter()
        +limpar()
    }

    class UIManager {
        +renderizarCardapio()
        +renderizarCardapio()
        +atualizarTotal()
        +mostrarNotificacao(mensagem)
    }

    Pedido --> CarrinhoItem : contém (1 para N)
    CarrinhoItem --> Produto : referencia (1 para 1)
    Pedido ..> LocalStorageService : persiste dados
    UIManager --> Pedido : manipula estado
    UIManager --> Produto : exibe na tela
