import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Produto, Cliente } from '../types';
import type { ItemVenda } from '../types';
import VendaResumoModal, { type VendaResumo } from '../components/VendaResumoModal';
import './PDV.css';

// Interface estendida para controle visual no Front-end
interface ItemVendaLocal extends ItemVenda {
  isService?: boolean; // Flag para saber se é serviço visualmente
  tempId?: number;     // ID único para remover do carrinho (timestamp ou id do produto)
}

const PDV = () => {
  // --- CONFIGURAÇÃO ---
  const ID_MAO_DE_OBRA = 4; // O ID exato do produto coringa no banco

  // --- Estados de Dados ---
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  
  // --- Estados de Seleção ---
  const [produtoSelecionado, setProdutoSelecionado] = useState<number | ''>('');
  const [clienteSelecionado, setClienteSelecionado] = useState<number | ''>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  
  // --- Estados do Carrinho ---
  const [itensVenda, setItensVenda] = useState<ItemVendaLocal[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<string>('DINHEIRO');
  const [descricao, setDescricao] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // --- Estados Específicos para Adicionar Serviço ---
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

  // --- Lógica 1: Adicionar Produto de Estoque ---
  const adicionarItem = () => {
    if (!produtoSelecionado || quantidade <= 0) {
      alert('Selecione um produto e quantidade válida');
      return;
    }

    const produto = produtos.find(p => p.idProduto === produtoSelecionado);
    if (!produto) return;

    // Trava de segurança: Não deixa adicionar o ID 4 por aqui
    if (produto.idProduto === ID_MAO_DE_OBRA) {
      alert('⚠️ Atenção: Para adicionar Mão de Obra/Serviços, utilize o painel azul "Adicionar Serviço" logo abaixo.');
      setProdutoSelecionado('');
      return;
    }

    // Valida Estoque
    if (produto.quantidadeEstoque !== undefined && produto.quantidadeEstoque < quantidade) {
      alert(`Estoque insuficiente! Disponível: ${produto.quantidadeEstoque}`);
      return;
    }

    // Verifica se já existe no carrinho para somar quantidade
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
        tempId: produto.idProduto // Key única
      };
      setItensVenda([...itensVenda, novoItem]);
    }

    setProdutoSelecionado('');
    setQuantidade(1);
  };

  // --- Lógica 2: Adicionar Serviço (ID 4) ---
  const adicionarServico = () => {
    if (!servicoNome.trim()) {
      alert('Digite a descrição do serviço (ex: Instalação, Frete)');
      return;
    }
    
    const valor = parseFloat(servicoValor.replace(',', '.'));
    if (!valor || valor <= 0) {
      alert('Digite um valor válido (ex: 100.00)');
      return;
    }

    // Verifica se o produto coringa existe no front carregado
    const produtoCoringa = produtos.find(p => p.idProduto === ID_MAO_DE_OBRA);
    if (!produtoCoringa) {
      alert(`ERRO CRÍTICO: O produto com ID ${ID_MAO_DE_OBRA} (Mão de Obra) não foi encontrado no banco de dados.`);
      return;
    }

    const tempId = Date.now(); // Timestamp para gerar ID único visual

    const novoServico: ItemVendaLocal = {
      produtoId: ID_MAO_DE_OBRA,  // ID 4
      nomeProduto: servicoNome,   // Nome customizado
      quantidade: 1,
      precoUnitario: valor,       // Preço customizado
      precoTotal: valor,
      isService: true,            // Flag visual
      tempId: tempId
    };

    setItensVenda([...itensVenda, novoServico]);
    
    // Limpa inputs
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
    } catch (e) { console.error('Erro upload comprovante', e)}
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

    // Mapeamento para o DTO do Backend
    const payload = {
      clienteId: clienteSelecionado as number,
      descricao: descricao || 'Venda PDV',
      valorTotal: calcularTotal(),
      dataVenda: new Date().toISOString(),
      formaPagamento: formaPagamento,
      status: 'FINALIZADA',
      itensVendas: itensVenda.map(item => ({
        produtoId: item.produtoId,      // Vai o ID 4 se for serviço
        nomeItem: item.nomeProduto,     // IMPORTANTE: Envia o nome customizado
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        precoTotal: item.precoTotal
      }))
    };

    try {
      setLoading(true);
      const resp = await api.post('/ordens-venda', payload);
      const ordemCriada = resp.data || {}; // Ajuste se o retorno for diferente

      // Monta dados para o Modal
      const resumo: VendaResumo = {
        id: ordemCriada.id, 
        cliente: clientes.find(c => c.id === (clienteSelecionado as number)) ?? null,
        dataVenda: new Date().toISOString(),
        itens: itensVenda,
        valorTotal: calcularTotal(),
        formaPagamento: formaPagamento
      };
      
      setVendaResumo(resumo);
      setModalOpen(true);

      // Reset do PDV
      setItensVenda([]);
      setClienteSelecionado('');
      setDescricao('');
      setFormaPagamento('DINHEIRO');
      fetchProdutos(); // Atualiza estoque visual

    } catch (error: any) {
      console.error('Erro venda:', error);
      alert('Erro ao finalizar venda. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  // Filtros para renderização visual
  const listaProdutos = itensVenda.filter(i => !i.isService);
  const listaServicos = itensVenda.filter(i => i.isService);

  return (
    <div className="page-container">
      <h1 className="page-title">PDV - Nova Venda</h1>

      <div className="pdv-layout">
        
        {/* COLUNA ESQUERDA: SELEÇÃO E CADASTRO */}
        <div className="pdv-selection">
          
          {/* 1. CLIENTE */}
          <div className="card">
            <h2>👤 Cliente</h2>
            <select
              value={clienteSelecionado}
              onChange={(e) => setClienteSelecionado(Number(e.target.value))}
              className="select-input"
            >
              <option value="">Selecione o Cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          {/* 2. PRODUTOS (ESTOQUE) */}
          <div className="card">
            <h2>📦 Adicionar Produto</h2>
            <div className="produto-form">
              <select
                value={produtoSelecionado}
                onChange={(e) => setProdutoSelecionado(Number(e.target.value))}
                className="select-input"
              >
                <option value="">Selecione o Produto...</option>
                {produtos
                  .filter(p => p.idProduto !== ID_MAO_DE_OBRA) // Filtra Mão de Obra daqui
                  .map(p => (
                    <option key={p.idProduto} value={p.idProduto}>
                      {p.nome} | {formatPrice(p.precoVenda)} | Est: {p.quantidadeEstoque || 0}
                    </option>
                  ))}
              </select>
              
              <div className="quantidade-group">
                 <input 
                   type="number" 
                   min="1" 
                   value={quantidade} 
                   onChange={(e)=>setQuantidade(Number(e.target.value))}
                   className="qtd-input"
                 />
                 <button onClick={adicionarItem} className="btn-add">
                   + Adicionar
                 </button>
              </div>
            </div>
          </div>

          {/* 3. SERVIÇOS (CUSTOMIZADO) */}
          <div className="card servico-card">
            <h2 style={{color: '#0056b3'}}>🛠️ Adicionar Serviço / Mão de Obra</h2>
            <div className="servico-form-col">
              <input
                type="text"
                placeholder="Descrição (ex: Instalação, Frete...)"
                className="text-input"
                value={servicoNome}
                onChange={e => setServicoNome(e.target.value)}
              />
              
              <div className="servico-actions">
                <div className="input-wrapper">
                    <span className="currency-symbol">R$</span>
                    <input
                    type="number"
                    placeholder="0.00"
                    className="text-input price-input"
                    value={servicoValor}
                    onChange={e => setServicoValor(e.target.value)}
                    />
                </div>
                <button onClick={adicionarServico} className="btn-add btn-service">
                  + Add Serviço
                </button>
              </div>
            </div>
          </div>

          {/* 4. PAGAMENTO E OBS */}
          <div className="card">
             <h2>💳 Pagamento</h2>
             <div className="form-group">
               <select value={formaPagamento} onChange={e=>setFormaPagamento(e.target.value)} className="select-input">
                 <option value="DINHEIRO">💵 Dinheiro</option>
                 <option value="PIX">💠 Pix</option>
                 <option value="CARTAO_CREDITO">💳 Cartão de Crédito</option>
                 <option value="CARTAO_DEBITO">💳 Cartão de Débito</option>
               </select>
             </div>
             <textarea 
               placeholder="Observações da venda (opcional)..." 
               value={descricao} 
               onChange={e=>setDescricao(e.target.value)} 
               rows={2} 
               className="obs-input"
             />
          </div>
        </div>

        {/* COLUNA DIREITA: CARRINHO */}
        <div className="pdv-cart">
          <div className="card cart-card">
            <div className="cart-header">
                <h2>🛒 Itens da Venda</h2>
                <span className="badge-count">{itensVenda.length} itens</span>
            </div>

            {itensVenda.length === 0 ? (
              <div className="empty-cart">
                <p>O carrinho está vazio.</p>
                <small>Adicione produtos ou serviços à esquerda.</small>
              </div>
            ) : (
              <div className="cart-content">
                <div className="cart-scroll">
                    {/* LISTA DE PRODUTOS */}
                    {listaProdutos.length > 0 && (
                        <div className="cart-section">
                            <h4 className="section-label">Produtos</h4>
                            {listaProdutos.map(item => (
                            <div key={item.tempId} className="cart-item">
                                <div className="item-info">
                                <div className="item-name">{item.nomeProduto}</div>
                                <div className="item-calc">
                                    {item.quantidade} x {formatPrice(item.precoUnitario)}
                                </div>
                                </div>
                                <div className="item-total">
                                    {formatPrice(item.precoTotal)}
                                    <button onClick={() => removerItem(item.tempId!)} className="btn-remove" title="Remover">✕</button>
                                </div>
                            </div>
                            ))}
                        </div>
                    )}

                    {/* LISTA DE SERVIÇOS */}
                    {listaServicos.length > 0 && (
                        <div className="cart-section service-section">
                            <h4 className="section-label">Serviços</h4>
                            {listaServicos.map(item => (
                            <div key={item.tempId} className="cart-item cart-item-service">
                                <div className="item-info">
                                <div className="item-name">{item.nomeProduto}</div>
                                <div className="item-calc">Valor Único</div>
                                </div>
                                <div className="item-total">
                                    {formatPrice(item.precoTotal)}
                                    <button onClick={() => removerItem(item.tempId!)} className="btn-remove" title="Remover">✕</button>
                                </div>
                            </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="cart-footer">
                    <div className="total-row">
                        <span>Total a Pagar:</span>
                        <span className="total-value">{formatPrice(calcularTotal())}</span>
                    </div>
                    <button 
                        onClick={finalizarVenda} 
                        disabled={loading} 
                        className="btn-finalizar"
                    >
                        {loading ? 'Processando...' : '✅ Finalizar Venda'}
                    </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <VendaResumoModal
        open={modalOpen}
        venda={vendaResumo}
        onClose={() => { setModalOpen(false); setVendaResumo(null); }}
        onSaveComprovante={async (html) => {
           if(vendaResumo?.id) await uploadComprovante(vendaResumo.id, html);
        }}
      />
    </div>
  );
};

export default PDV;