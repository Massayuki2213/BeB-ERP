import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import type { Produto } from '../types';
import './Pages.css';
import './ProductSearch.css'; // Importa o CSS novo

// Componentes
import ProductFilters from '../components/ProductFilters'; // O novo componente acima
import ProdutoFormModal from '../components/ProdutoFormModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

type SortKey = 'id' | 'nome' | 'precoVenda' | 'quantidadeEstoque';

const Produtos = () => {
  // --- Estados de Dados ---
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // --- Estados de Filtro ---
  const [search, setSearch] = useState('');
  const [minQtd, setMinQtd] = useState('');
  const [maxQtd, setMaxQtd] = useState('');
  
  // --- Estados de Ordenação ---
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // --- Estados dos Modais ---
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

  // --- Lógica de Filtragem e Ordenação Unificada ---
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...produtos];

    // 1. Filtro de Texto (Nome, ID, Preço)
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => 
        p.nome.toLowerCase().includes(q) ||
        String(p.id).includes(q) ||
        String(p.precoVenda).includes(q)
      );
    }

    // 2. Filtro de Quantidade (Range)
    if (minQtd) {
      result = result.filter(p => (p.quantidadeEstoque || 0) >= Number(minQtd));
    }
    if (maxQtd) {
      result = result.filter(p => (p.quantidadeEstoque || 0) <= Number(maxQtd));
    }

    // 3. Ordenação
    result.sort((a, b) => {
      const valA = a[sortKey] ?? 0; // Trata null/undefined como 0 ou vazio
      const valB = b[sortKey] ?? 0;
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [produtos, search, minQtd, maxQtd, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // --- Helpers ---
  const formatPrice = (price?: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price ?? 0);

  // --- Handlers dos Modais (Iguais ao anterior) ---
  const handleOpenCreate = () => { setProdutoToEdit(null); setIsFormModalOpen(true); };
  const handleOpenEdit = (p: Produto) => { setProdutoToEdit(p); setIsFormModalOpen(true); };
  const handleOpenDelete = (id: number) => { setProdutoToDelete(id); setIsDeleteModalOpen(true); };
  
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
      setProdutos(prev => prev.filter(p => p.id !== produtoToDelete));
      handleCloseModals();
    } catch {
      alert('Erro ao excluir.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gerenciar Produtos</h1>
          <p style={{color: '#666', fontSize: '0.9rem'}}>Visualize e gerencie seu estoque</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          + Novo Produto
        </button>
      </div>

      {/* Componente de Filtros (Separado mas controla os dados desta página) */}
      <ProductFilters 
        search={search} setSearch={setSearch}
        minQtd={minQtd} setMinQtd={setMinQtd}
        maxQtd={maxQtd} setMaxQtd={setMaxQtd}
      />

      {loading && <div className="loading">Carregando dados...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')}>
                  ID {sortKey === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('nome')}>
                  Nome {sortKey === 'nome' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('precoVenda')}>
                  Preço Venda {sortKey === 'precoVenda' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('quantidadeEstoque')}>
                  Estoque {sortKey === 'quantidadeEstoque' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedProducts.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign: 'center', padding: 30}}>Nenhum produto encontrado.</td></tr>
              ) : (
                filteredAndSortedProducts.map((produto) => (
                  <tr key={produto.id}>
                    <td>#{produto.id}</td>
                    <td style={{fontWeight: 500}}>{produto.nome}</td>
                    <td>{formatPrice(produto.precoVenda)}</td>
                    <td>
                      <span style={{
                        color: (produto.quantidadeEstoque || 0) < 5 ? 'red' : 'green',
                        fontWeight: 'bold'
                      }}>
                        {produto.quantidadeEstoque || 0} un
                      </span>
                    </td>
                    <td>
                      <div className="btn-actions">
                        <button className="btn-small btn-edit" onClick={() => handleOpenEdit(produto)}>
                          Editar
                        </button>
                        <button className="btn-small btn-delete" onClick={() => handleOpenDelete(produto.id)}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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