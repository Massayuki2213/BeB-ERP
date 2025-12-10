// erp-frontend/src/pages/Produtos.tsx
import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import type { Produto } from '../types';
import './Pages.css';
import './ProductSearch.css'; 

// Componentes
import ProductFilters from '../components/ProductFilters';
import ProdutoFormModal from '../components/ProdutoFormModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

// --- ÍCONES ---
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const PlusIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

// Função auxiliar para pegar o ID independente se o back manda 'id' ou 'idProduto'
const getProductId = (p: any): number => {
  return p.idProduto || p.id || 0;
};

type SortKey = 'id' | 'nome' | 'precoVenda' | 'quantidadeEstoque';

const Produtos = () => {
  // --- Estados ---
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Filtros
  const [search, setSearch] = useState('');
  const [minQtd, setMinQtd] = useState('');
  const [maxQtd, setMaxQtd] = useState('');
  
  // Ordenação
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [produtoToEdit, setProdutoToEdit] = useState<Produto | null>(null);
  const [produtoToDelete, setProdutoToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const response = await api.get<Produto[]>('/produtos');
      setProdutos(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Erro ao carregar produtos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica de Filtro/Sort ---
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...produtos];

    // Filtros
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => {
        const id = getProductId(p);
        return (
          p.nome.toLowerCase().includes(q) ||
          String(id).includes(q) ||
          (p.categoria && p.categoria.toLowerCase().includes(q))
        );
      });
    }
    if (minQtd) result = result.filter(p => (p.quantidadeEstoque || 0) >= Number(minQtd));
    if (maxQtd) result = result.filter(p => (p.quantidadeEstoque || 0) <= Number(maxQtd));

    // Ordenação
    result.sort((a, b) => {
      let valA: any = a[sortKey as keyof Produto];
      let valB: any = b[sortKey as keyof Produto];

      // Ajuste especial para ID
      if (sortKey === 'id') {
        valA = getProductId(a);
        valB = getProductId(b);
      }

      if ((valA ?? 0) < (valB ?? 0)) return sortOrder === 'asc' ? -1 : 1;
      if ((valA ?? 0) > (valB ?? 0)) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [produtos, search, minQtd, maxQtd, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    setSortOrder(prev => (sortKey === key && prev === 'asc') ? 'desc' : 'asc');
    setSortKey(key);
  };

  const formatPrice = (price?: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price ?? 0);

  // --- Handlers ---
  const handleOpenCreate = () => { setProdutoToEdit(null); setIsFormModalOpen(true); };
  
  const handleOpenEdit = (p: Produto) => { 
    const id = getProductId(p);
    if (!id) {
        alert("Erro: Produto sem ID. Verifique o cadastro.");
        return;
    }
    setProdutoToEdit(p); 
    setIsFormModalOpen(true); 
  };
  
  const handleOpenDelete = (p: Produto) => { 
    const id = getProductId(p);
    if(id) {
        setProdutoToDelete(id); 
        setIsDeleteModalOpen(true); 
    }
  };
  
  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setProdutoToEdit(null);
    setProdutoToDelete(null);
  };

  const handleFormSuccess = () => { handleCloseModals(); fetchProdutos(); };

  const handleDeleteConfirm = async () => {
    if (!produtoToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/produtos/${produtoToDelete}`);
      setProdutos(prev => prev.filter(p => getProductId(p) !== produtoToDelete));
      handleCloseModals();
    } catch {
      alert('Erro ao excluir.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header">
        <div className="page-title">
          <h1>Gerenciar Produtos</h1>
          <p>Visualize e gerencie seu estoque</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          <PlusIcon /> Novo Produto
        </button>
      </div>

      {/* COMPONENTE DE FILTROS */}
      <ProductFilters 
        search={search} setSearch={setSearch}
        minQtd={minQtd} setMinQtd={setMinQtd}
        maxQtd={maxQtd} setMaxQtd={setMaxQtd}
      />

      {loading && <div style={{padding: '2rem', textAlign: 'center'}}>Carregando...</div>}
      {error && <div style={{color: 'red', padding: '1rem'}}>{error}</div>}

      {!loading && !error && (
        <div className="table-wrapper"> 
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} style={{cursor: 'pointer'}}>
                  ID {sortKey === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('nome')} style={{cursor: 'pointer'}}>
                  Nome {sortKey === 'nome' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Categoria</th>
                <th onClick={() => handleSort('precoVenda')} style={{cursor: 'pointer'}}>
                  Preço {sortKey === 'precoVenda' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('quantidadeEstoque')} style={{cursor: 'pointer'}}>
                  Estoque {sortKey === 'quantidadeEstoque' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="col-actions">Ações</th> 
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedProducts.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign: 'center', padding: '2rem'}}>Nenhum produto encontrado.</td></tr>
              ) : (
                filteredAndSortedProducts.map((produto) => {
                  const id = getProductId(produto);
                  return (
                    <tr key={id}> 
                        <td>#{id}</td>
                        <td style={{fontWeight: 500}}>{produto.nome}</td>
                        <td>{produto.categoria || '—'}</td>
                        <td>{formatPrice(produto.precoVenda)}</td>
                        <td>
                        <span style={{
                            color: (produto.quantidadeEstoque || 0) < 5 ? '#ef4444' : '#10b981', 
                            fontWeight: 600,
                            background: (produto.quantidadeEstoque || 0) < 5 ? '#fef2f2' : '#ecfdf5',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.85rem'
                        }}>
                            {produto.quantidadeEstoque || 0} un
                        </span>
                        </td>
                        <td className="col-actions">
                        <button className="btn-icon" onClick={() => handleOpenEdit(produto)} title="Editar">
                            <EditIcon />
                        </button>
                        <button className="btn-icon delete" onClick={() => handleOpenDelete(produto)} title="Excluir">
                            <TrashIcon />
                        </button>
                        </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modais */}
      <ProdutoFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSuccess={handleFormSuccess}
        produtoToEdit={produtoToEdit}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Produtos;