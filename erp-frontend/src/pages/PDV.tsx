import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Produto, Cliente } from '../types';
import type { ItemVenda } from '../types';
import './PDV.css';

const PDV = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<number | ''>('');
  const [clienteSelecionado, setClienteSelecionado] = useState<number | ''>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<string>('DINHEIRO');
  const [descricao, setDescricao] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProdutos();
    fetchClientes();
  }, []);

  const fetchProdutos = async () => {
    try {
      const response = await api.get<Produto[]>('/produtos');
      setProdutos(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await api.get<Cliente[]>('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const adicionarItem = () => {
    if (!produtoSelecionado || quantidade <= 0) {
      alert('Selecione um produto e quantidade válida');
      return;
    }

    const produto = produtos.find(p => p.id === produtoSelecionado);
    if (!produto) return;

    if (produto.quantidadeEstoque && produto.quantidadeEstoque < quantidade) {
      alert(`Estoque insuficiente! Disponível: ${produto.quantidadeEstoque}`);
      return;
    }

    const itemExistente = itensVenda.find(item => item.produtoId === produtoSelecionado);

    if (itemExistente) {
      setItensVenda(itensVenda.map(item =>
        item.produtoId === produtoSelecionado
          ? {
              ...item,
              quantidade: item.quantidade + quantidade,
              precoTotal: (item.quantidade + quantidade) * item.precoUnitario
            }
          : item
      ));
    } else {
      const novoItem: ItemVenda = {
        produtoId: produto.id,
        nomeProduto: produto.nome,
        quantidade: quantidade,
        precoUnitario: produto.precoVenda,
        precoTotal: produto.precoVenda * quantidade
      };
      setItensVenda([...itensVenda, novoItem]);
    }

    setProdutoSelecionado('');
    setQuantidade(1);
  };

  const removerItem = (produtoId: number) => {
    setItensVenda(itensVenda.filter(item => item.produtoId !== produtoId));
  };

  const calcularTotal = (): number => {
    return itensVenda.reduce((total, item) => total + item.precoTotal, 0);
  };

  const finalizarVenda = async () => {
    if (!clienteSelecionado) {
      alert('Selecione um cliente');
      return;
    }

    if (itensVenda.length === 0) {
      alert('Adicione pelo menos um produto');
      return;
    }

    const novaVenda = {
      clienteId: clienteSelecionado as number,
      descricao: descricao || 'Venda realizada',
      valorTotal: calcularTotal(),
      dataVenda: new Date().toISOString().slice(0, 19),
      formaPagamento: formaPagamento,
      status: 'FINALIZADA',
      itensVendas: itensVenda.map(item => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        precoTotal: item.precoTotal
      }))
    };

    try {
      setLoading(true);
      await api.post('/ordens-venda', novaVenda);
      alert('Venda finalizada com sucesso! ✓');

      setItensVenda([]);
      setClienteSelecionado('');
      setDescricao('');
      setFormaPagamento('DINHEIRO');

      fetchProdutos();
    } catch (error: any) {
      console.error('Erro ao finalizar venda:', error);
      if (error?.response) {
        console.error('Status:', error.response.status);
        console.error('Resposta do servidor:', error.response.data);
        alert('Erro ao finalizar venda: ' + (error.response.data?.message || JSON.stringify(error.response.data)));
      } else {
        alert('Erro ao finalizar venda. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">PDV - Ponto de Venda</h1>

      <div className="pdv-layout">
        <div className="pdv-selection">
          <div className="card">
            <h2>Cliente</h2>
            <select
              value={clienteSelecionado}
              onChange={(e) => setClienteSelecionado(Number(e.target.value))}
              className="select-input"
            >
              <option value="">Selecione um cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
                
              ))}
            </select>
          </div>

          <div className="card">
            <h2>Adicionar Produto</h2>
            <div className="produto-form">
              <select
                value={produtoSelecionado}
                onChange={(e) => setProdutoSelecionado(Number(e.target.value))}
                className="select-input"
              >
                <option value="">Selecione um produto</option>
                {produtos.map(produto => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome} - {formatPrice(produto.precoVenda)} (Est: {produto.quantidadeEstoque || 0})
                  </option>
                ))}
              </select>

              <div className="quantidade-input">
                <label>Quantidade:</label>
                <input
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                />
              </div>

              <button onClick={adicionarItem} className="btn-add">
                + Adicionar
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Informações da Venda</h2>
            <div className="form-group">
              <label>Forma de Pagamento:</label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="select-input"
              >
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="PIX">PIX</option>
              </select>
            </div>

            <div className="form-group">
              <label>Descrição (Opcional):</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Observações sobre a venda..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="pdv-cart">
          <div className="card cart-card">
            <h2>Itens da Venda</h2>

            {itensVenda.length === 0 ? (
              <div className="empty-cart">
                <p>🛒 Carrinho vazio</p>
                <p>Adicione produtos para iniciar a venda</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {itensVenda.map(item => (
                    <div key={item.produtoId} className="cart-item">
                      <div className="item-info">
                        <strong>{item.nomeProduto}</strong>
                        <p>
                          {item.quantidade}x {formatPrice(item.precoUnitario)} = {formatPrice(item.precoTotal)}
                        </p>
                      </div>
                      <button
                        onClick={() => removerItem(item.produtoId)}
                        className="btn-remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-total">
                  <h3>Total: {formatPrice(calcularTotal())}</h3>
                </div>

                <button
                  onClick={finalizarVenda}
                  disabled={loading || !clienteSelecionado}
                  className="btn-finalizar"
                >
                  {loading ? 'Processando...' : '✓ Finalizar Venda'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDV;
