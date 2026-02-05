import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  ScanBarcode, 
  Loader2, 
  X
} from 'lucide-react';
import './Pages.css'; 

// --- TIPAGEM BASEADA NO SEU JAVA ---
interface Produto {
  idProduto: number; 
  nome: string;
  descricao?: string;
  precoCusto: number;
  precoVenda: number;
  quantidadeEstoque: number; 
  categoria?: string;
  codigoBarras?: string; 
}

// Interface para o formulário
interface ProdutoForm {
    nome: string;
    descricao: string;
    precoVenda: number | string;
    precoCusto: number | string;
    quantidadeEstoque: number | string;
    codigoBarras: string;
    categoria: string;
}

const Produtos = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  
  // Controle do Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  // Loading da busca de EAN
  const [loadingEan, setLoadingEan] = useState(false);

  // Formulário
  const [formData, setFormData] = useState<ProdutoForm>({
    nome: '',
    descricao: '',
    precoVenda: '',
    precoCusto: '',
    quantidadeEstoque: '',
    codigoBarras: '',
    categoria: ''
  });

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const response = await api.get<Produto[]>('/produtos');
      setProdutos(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE BUSCA VIA BACKEND (PROXY) ---
  const buscarDadosEan = async () => {
    if (!formData.codigoBarras) return;
    
    setLoadingEan(true);
    try {
      const response = await api.get(`/consultas/ean/${formData.codigoBarras}`);
      
      const data = response.data;

      if (data) {
        setFormData(prev => ({
          ...prev,
          nome: data.description || prev.nome,
          descricao: data.brand ? `${data.brand.name} - ${data.ncm?.description || ''}` : prev.descricao,
          categoria: data.gpc?.description || prev.categoria
        }));
      }
    } catch (error) {
      console.log("Produto não encontrado na base externa ou erro de conexão.");
    } finally {
      setLoadingEan(false);
    }
  };

  const handleKeyDownEan = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      buscarDadosEan();
    }
  };

  // --- CRUD ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        categoria: formData.categoria,
        precoCusto: Number(formData.precoCusto),
        precoVenda: Number(formData.precoVenda),
        quantidadeEstoque: Number(formData.quantidadeEstoque),
        codigoBarras: formData.codigoBarras 
      };

      if (editId) {
        const res = await api.patch(`/produtos/${editId}`, payload);
        setProdutos(produtos.map(p => p.idProduto === editId ? { ...p, ...res.data } : p));
      } else {
        const res = await api.post('/produtos', payload);
        setProdutos([...produtos, res.data]);
      }
      resetModal();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert('Erro ao salvar produto. Verifique se todos os campos estão preenchidos.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await api.delete(`/produtos/${id}`);
      setProdutos(produtos.filter(p => p.idProduto !== id));
    } catch { 
      alert('Erro ao excluir produto.'); 
    }
  };

  // --- MODAL CONTROL ---
  const resetModal = () => {
    setEditId(null);
    setFormData({ nome: '', descricao: '', precoVenda: '', precoCusto: '', quantidadeEstoque: '', codigoBarras: '', categoria: '' });
    setShowModal(false);
  };

  const handleOpenEdit = (p: Produto) => {
    setEditId(p.idProduto);
    setFormData({
      nome: p.nome,
      descricao: p.descricao || '',
      precoVenda: p.precoVenda,
      precoCusto: p.precoCusto || 0,
      quantidadeEstoque: p.quantidadeEstoque || 0,
      categoria: p.categoria || '',
      codigoBarras: p.codigoBarras || '' 
    });
    setShowModal(true);
  };

  const handleOpenCreate = () => {
    resetModal();
    setShowModal(true);
  };

  const formatPrice = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // --- FILTROS ---
  const filteredProducts = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return produtos.filter(p => 
      p.nome.toLowerCase().includes(lowerSearch) || 
      String(p.idProduto).includes(lowerSearch) ||
      (p.codigoBarras && p.codigoBarras.includes(lowerSearch))
    );
  }, [produtos, searchTerm]);

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header">
        <div className="page-title">
          <h1>Gerenciar Produtos</h1>
          <p>Visualize e gerencie seu estoque</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          <Plus size={20} style={{ marginRight: 8 }} /> Novo Produto
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            placeholder="Buscar por nome, código ou ID..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABELA */}
      <div className="table-wrapper">
        {loading ? (
           <div className="loading-state">
              <Loader2 className="spin" size={24} /> Carregando estoque...
           </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{width: '60px'}}>ID</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Estoque</th>
                <th>Preço Venda</th>
                <th className="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                   <td colSpan={6} className="empty-state">
                      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}>
                         <Package size={40} opacity={0.3} />
                         Nenhum produto encontrado.
                      </div>
                   </td>
                </tr>
              ) : filteredProducts.map((produto) => (
                  <tr key={produto.idProduto}>
                    <td><span style={{color: '#64748b', fontSize: '0.85rem'}}>#{produto.idProduto}</span></td>
                    <td>
                        <div style={{fontWeight: 600, color: '#1e293b'}}>{produto.nome}</div>
                        <div style={{fontSize: '0.75rem', color: '#64748b'}}>{produto.descricao}</div>
                    </td>
                    <td>
                        <span style={{background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem', color: '#475569'}}>
                            {produto.categoria || 'Geral'}
                        </span>
                    </td>
                    <td>
                        <span style={{
                            color: (produto.quantidadeEstoque || 0) < 5 ? '#ef4444' : '#10b981',
                            fontWeight: 600,
                            background: (produto.quantidadeEstoque || 0) < 5 ? '#fef2f2' : '#ecfdf5',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.85rem'
                        }}>
                            {produto.quantidadeEstoque} un
                        </span>
                    </td>
                    <td style={{fontWeight: 600}}>{formatPrice(produto.precoVenda)}</td>
                    <td className="col-actions">
                      <button className="btn-icon" onClick={() => handleOpenEdit(produto)} title="Editar">
                         <Edit size={18} />
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(produto.idProduto)} title="Excluir">
                         <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={resetModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            
            {/* CABEÇALHO DO MODAL (Corrigido o botão X) */}
            <div className="modal-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
               <h2 style={{margin: 0, fontSize: '1.25rem', color: '#1e293b'}}>{editId ? 'Editar Produto' : 'Novo Produto'}</h2>
               <button 
                onClick={resetModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
               >
                 <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleSave} className="form-grid">
              
              {/* CÓDIGO DE BARRAS */}
              <div className="form-group full-width" style={{background: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #dbeafe'}}>
                 <label style={{color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.9rem'}}>
                    <ScanBarcode size={18} /> Código de Barras / EAN
                 </label>
                 
                 <div style={{display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'stretch'}}>
                    <input 
                        value={formData.codigoBarras} 
                        onChange={e => setFormData({...formData, codigoBarras: e.target.value})}
                        onKeyDown={handleKeyDownEan}
                        placeholder="Bipe o produto aqui e dê Enter..."
                        className="modal-input"
                        autoFocus={!editId} 
                        style={{flex: 1}}
                    />
                    
                    {/* BOTÃO DA LUPA (Corrigido a centralização) */}
                    <button 
                      type="button" 
                      onClick={buscarDadosEan} 
                      disabled={loadingEan} 
                      style={{
                        minWidth: '46px',
                        padding: '0',
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                        {loadingEan ? <Loader2 size={20} className="spin" /> : <Search size={20} />}
                    </button>
                 </div>
                 
                 <small style={{color: '#64748b', fontSize: '12px', marginTop: '6px', display: 'block', lineHeight: '1.4'}}>
                    * Ao bipar ou clicar na lupa, buscaremos os dados na internet. Se não achar, preencha manualmente.
                 </small>
              </div>

              <div className="form-group full-width">
                <label>Nome do Produto</label>
                <input required className="modal-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>

              <div className="form-group full-width">
                <label>Descrição</label>
                <input className="modal-input" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} />
              </div>

              <div className="form-group">
                 <label>Categoria</label>
                 <input className="modal-input" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} />
              </div>

              <div className="form-group">
                 <label>Estoque Atual</label>
                 <input type="number" className="modal-input" value={formData.quantidadeEstoque} onChange={e => setFormData({...formData, quantidadeEstoque: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Preço Custo (R$)</label>
                <input type="number" step="0.01" className="modal-input" value={formData.precoCusto} onChange={e => setFormData({...formData, precoCusto: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Preço Venda (R$)</label>
                <input type="number" step="0.01" required className="modal-input" value={formData.precoVenda} onChange={e => setFormData({...formData, precoVenda: e.target.value})} />
              </div>

              <div className="modal-footer full-width">
                <button type="button" className="btn-secondary" onClick={resetModal}>Cancelar</button>
                <button type="submit" className="btn-primary">
                    {editId ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Produtos;