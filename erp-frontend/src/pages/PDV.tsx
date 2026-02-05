import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Produto, Cliente } from '../types';
import type { ItemVenda } from '../types';
import VendaResumoModal, { type VendaResumo } from '../components/VendaResumoModal';
import {
  User,
  Package,
  Wrench,
  CreditCard,
  ShoppingCart,
  Trash2,
  Plus,
  Car,
  DollarSign,
  CheckCircle,
  Search
} from 'lucide-react';
import './PDV.css';

// Interface estendida para controle visual no Front-end
interface ItemVendaLocal extends ItemVenda {
  isService?: boolean; // Flag para saber se é serviço visualmente
  tempId?: number;     // ID único para remover do carrinho
}

const PDV = () => {
  // --- CONFIGURAÇÃO ---
  const ID_MAO_DE_OBRA = 4;

  // --- Estados de Dados ---
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  // --- Estados de Seleção ---
  const [produtoSelecionado, setProdutoSelecionado] = useState<number | ''>('');
  const [clienteSelecionado, setClienteSelecionado] = useState<number | ''>('');
  const [quantidade, setQuantidade] = useState<number>(1);

  // --- ESTADOS DO VEÍCULO ---
  const [veiculoPlaca, setVeiculoPlaca] = useState<string>('');
  const [veiculoModelo, setVeiculoModelo] = useState<string>('');
  const [veiculoCor, setVeiculoCor] = useState<string>('');

  // --- Estados do Carrinho ---
  const [itensVenda, setItensVenda] = useState<ItemVendaLocal[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<string>('DINHEIRO');
  const [descricao, setDescricao] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // --- Estados Serviço ---
  const [servicoNome, setServicoNome] = useState('');
  const [servicoValor, setServicoValor] = useState('');

  // --- Modal ---
  const [vendaResumo, setVendaResumo] = useState<VendaResumo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  // --- Lógica 1: Adicionar Produto ---
  const adicionarItem = () => {
    if (!produtoSelecionado || quantidade <= 0) {
      alert('Selecione um produto e quantidade válida');
      return;
    }

    const produto = produtos.find(p => p.idProduto === produtoSelecionado);
    if (!produto) return;

    if (produto.idProduto === ID_MAO_DE_OBRA) {
      alert('⚠️ Atenção: Para adicionar Mão de Obra/Serviços, utilize o painel "Adicionar Serviço" abaixo.');
      setProdutoSelecionado('');
      return;
    }

    if (produto.quantidadeEstoque !== undefined && produto.quantidadeEstoque < quantidade) {
      alert(`Estoque insuficiente! Disponível: ${produto.quantidadeEstoque}`);
      return;
    }

    const itemExistente = itensVenda.find(item => !item.isService && item.produtoId === produtoSelecionado);

    if (itemExistente) {
      setItensVenda(itensVenda.map(item =>
        (!item.isService && item.produtoId === produtoSelecionado)
          ? {
            ...item,
            quantidade: item.quantidade + quantidade,
            precoTotal: (item.quantidade + quantidade) * item.precoUnitario
          }
          : item
      ));
    } else {
      const novoItem: ItemVendaLocal = {
        produtoId: produto.idProduto,
        nomeProduto: produto.nome,
        quantidade: quantidade,
        precoUnitario: produto.precoVenda,
        precoTotal: produto.precoVenda * quantidade,
        isService: false,
        tempId: produto.idProduto
      };
      setItensVenda([...itensVenda, novoItem]);
    }

    setProdutoSelecionado('');
    setQuantidade(1);
  };

  // --- Lógica 2: Adicionar Serviço ---
  const adicionarServico = () => {
    if (!servicoNome.trim()) {
      alert('Digite a descrição do serviço');
      return;
    }

    const valor = parseFloat(servicoValor.replace(',', '.'));
    if (!valor || valor <= 0) {
      alert('Digite um valor válido');
      return;
    }

    const produtoCoringa = produtos.find(p => p.idProduto === ID_MAO_DE_OBRA);
    if (!produtoCoringa) {
      alert(`ERRO CRÍTICO: Produto ID ${ID_MAO_DE_OBRA} não encontrado.`);
      return;
    }

    const tempId = Date.now();

    const novoServico: ItemVendaLocal = {
      produtoId: ID_MAO_DE_OBRA,
      nomeProduto: servicoNome,
      quantidade: 1,
      precoUnitario: valor,
      precoTotal: valor,
      isService: true,
      tempId: tempId
    };

    setItensVenda([...itensVenda, novoServico]);
    setServicoNome('');
    setServicoValor('');
  };

  const removerItem = (tempIdParaRemover: number) => {
    setItensVenda(itensVenda.filter(item => item.tempId !== tempIdParaRemover));
  };

  const calcularTotal = (): number => {
    return itensVenda.reduce((total, item) => total + item.precoTotal, 0);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const uploadComprovante = async (orderId: number, htmlContent: string) => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const fd = new FormData();
    const fileName = `comprovante-${orderId}.html`;
    fd.append('file', blob, fileName);
    try {
      await api.post(`/ordens-venda/${orderId}/comprovante`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (e) { console.error('Erro upload comprovante', e) }
  };

  const finalizarVenda = async () => {
    if (!clienteSelecionado) {
      alert('Selecione um cliente no topo da página');
      return;
    }
    if (itensVenda.length === 0) {
      alert('O carrinho está vazio');
      return;
    }

    let finalDescription = descricao || 'Venda PDV';

    if (veiculoPlaca || veiculoModelo || veiculoCor) {
      const veiculoInfo = `[VEÍCULO: PLACA=${veiculoPlaca.toUpperCase() || 'N/A'}, MODELO=${veiculoModelo || 'N/A'}, COR=${veiculoCor || 'N/A'}]`;
      finalDescription = veiculoInfo + (descricao ? ` | ${descricao}` : '');
    }

    const payload = {
      clienteId: clienteSelecionado as number,
      descricao: finalDescription,
      valorTotal: calcularTotal(),
      dataVenda: new Date().toISOString(),
      formaPagamento: formaPagamento,
      status: 'FINALIZADA',
      itensVendas: itensVenda.map(item => ({
        produtoId: item.produtoId,
        nomeItem: item.nomeProduto,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        precoTotal: item.precoTotal
      }))
    };

    try {
      setLoading(true);
      const resp = await api.post('/ordens-venda', payload);
      const ordemCriada = resp.data || {};

      const resumo: VendaResumo = {
        id: ordemCriada.id,
        cliente: clientes.find(c => c.id === (clienteSelecionado as number)) ?? null,
        dataVenda: new Date().toISOString(),
        itens: itensVenda,
        valorTotal: calcularTotal(),
        formaPagamento: formaPagamento,
        descricao: finalDescription,
      };

      setVendaResumo(resumo);
      setModalOpen(true);

      setItensVenda([]);
      setClienteSelecionado('');
      setDescricao('');
      setFormaPagamento('DINHEIRO');
      setVeiculoPlaca('');
      setVeiculoModelo('');
      setVeiculoCor('');
      fetchProdutos();

    } catch (error: any) {
      console.error('Erro venda:', error);
      alert('Erro ao finalizar venda.');
    } finally {
      setLoading(false);
    }
  };

  const listaProdutos = itensVenda.filter(i => !i.isService);
  const listaServicos = itensVenda.filter(i => i.isService);

  return (
    <div className="pdv-container">
      <div className="pdv-header">
        <h1>PDV - Nova Venda</h1>
      </div>

      <div className="pdv-layout">

        {/* COLUNA ESQUERDA */}
        <div className="pdv-selection">

          {/* 1. CLIENTE */}
          <div className="pdv-card">
            <h2 className="card-title">
              <User size={20} /> Cliente
            </h2>
            <div className="input-group">
              <select
                value={clienteSelecionado}
                onChange={(e) => setClienteSelecionado(Number(e.target.value))}
                className="pdv-input"
              >
                <option value="">Selecione o Cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>

          {/* 1.5. VEÍCULO */}
          <div className="pdv-card">
            <h2 className="card-title text-muted">
              <Car size={20} /> Veículo (Opcional)
            </h2>
            <div className="veiculo-grid">
              <div>
                <label>Placa</label>
                <input
                  type="text"
                  placeholder="AAA-0000"
                  className="pdv-input"
                  value={veiculoPlaca}
                  onChange={e => setVeiculoPlaca(e.target.value.toUpperCase())}
                  maxLength={8}
                />
              </div>
              <div>
                <label>Modelo</label>
                <input
                  type="text"
                  placeholder="Ex: Fiat Uno"
                  className="pdv-input"
                  value={veiculoModelo}
                  onChange={e => setVeiculoModelo(e.target.value)}
                />
              </div>
              <div>
                <label>Cor</label>
                <input
                  type="text"
                  placeholder="Ex: Prata"
                  className="pdv-input"
                  value={veiculoCor}
                  onChange={e => setVeiculoCor(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 2. PRODUTOS */}
          <div className="pdv-card">
            <h2 className="card-title">
              <Package size={20} /> Adicionar Produto
            </h2>
            <div className="produto-row">
              <div style={{ flex: 1 }}>
                <select
                  value={produtoSelecionado}
                  onChange={(e) => setProdutoSelecionado(Number(e.target.value))}
                  className="pdv-input"
                >
                  <option value="">Selecione o Produto...</option>
                  {produtos
                    .filter(p => p.idProduto !== ID_MAO_DE_OBRA)
                    .map(p => (
                      <option key={p.idProduto} value={p.idProduto}>
                        {p.nome} | {formatPrice(p.precoVenda)} | Est: {p.quantidadeEstoque || 0}
                      </option>
                    ))}
                </select>
              </div>

              <div className="qtd-wrapper">
                <input
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  className="pdv-input qtd-input"
                />
                <button onClick={adicionarItem} className="btn-add">
                  <Plus size={18} /> Add
                </button>
              </div>
            </div>
          </div>

          {/* 3. SERVIÇOS */}
          <div className="pdv-card service-card-border">
            <h2 className="card-title text-primary">
              <Wrench size={20} /> Adicionar Serviço
            </h2>
            <div className="produto-row">
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Descrição do serviço..."
                  className="pdv-input"
                  value={servicoNome}
                  onChange={e => setServicoNome(e.target.value)}
                />
              </div>

              <div className="price-wrapper">
                <DollarSign size={16} className="currency-icon" />
                <input
                  type="number"
                  placeholder="0.00"
                  className="pdv-input price-input"
                  value={servicoValor}
                  onChange={e => setServicoValor(e.target.value)}
                />
                <button onClick={adicionarServico} className="btn-add btn-service">
                  <Plus size={18} /> Add
                </button>
              </div>
            </div>
          </div>

          {/* 4. PAGAMENTO */}
          <div className="pdv-card">
            <h2 className="card-title">
              <CreditCard size={20} /> Pagamento e Obs
            </h2>
            <div className="payment-col">
              <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} className="pdv-input">
                <option value="DINHEIRO">Dinheiro</option>
                <option value="PIX">Pix</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
              </select>
              <textarea
                placeholder="Observações adicionais..."
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                rows={2}
                className="pdv-input textarea-input"
              />
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: CARRINHO */}
        <div className={`pdv-cart-col ${itensVenda.length > 0 ? 'has-items' : ''}`}>
          <div className="cart-container">
            {/* No Mobile, este header pode ser um botão de "Abrir Detalhes" */}
            <div className="cart-header" onClick={() => /* lógica para abrir modal no mobile */ null}>
              <div className="cart-title-row">
                <ShoppingCart size={20} />
                <h2>{window.innerWidth < 768 ? 'Resumo' : 'Itens da Venda'}</h2>
              </div>
              <span className="badge-count">{itensVenda.length}</span>
            </div>

            <div className="cart-body">
              <div className="cart-body">
                {itensVenda.length === 0 ? (
                  <div className="cart-empty">
                    <ShoppingCart size={48} />
                    <p>Carrinho vazio</p>
                  </div>
                ) : (
                  <ul className="cart-list">
                    {itensVenda.map((item) => (
                      <li key={item.tempId} className={`cart-item ${item.isService ? 'service-item' : ''}`}>
                        <div className="item-info">
                          <span className="item-name">{item.nomeProduto}</span>
                          <span className="item-details">
                            {item.quantidade}x {formatPrice(item.precoUnitario)}
                          </span>
                        </div>
                        <div className="item-actions">
                          <span className="item-total">{formatPrice(item.precoTotal)}</span>
                          <button
                            onClick={() => removerItem(item.tempId!)}
                            className="btn-remove"
                            title="Remover item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="cart-footer">
              <div className="total-row">
                <span>Total</span>
                <span className="total-amount">{formatPrice(calcularTotal())}</span>
              </div>
              <button
                onClick={finalizarVenda}
                disabled={loading || itensVenda.length === 0}
                className="btn-checkout"
              >
                {loading ? '...' : <><CheckCircle size={20} /> Finalizar</>}
              </button>
            </div>
          </div>
        </div>

      </div>

      <VendaResumoModal
        open={modalOpen}
        venda={vendaResumo}
        onClose={() => { setModalOpen(false); setVendaResumo(null); }}
        onSaveComprovante={async (html) => {
          if (vendaResumo?.id) await uploadComprovante(vendaResumo.id, html);
        }}
      />
    </div>
  );
};

export default PDV;