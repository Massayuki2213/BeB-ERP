import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Produto } from '../types';
import {
  Plus, Search, Pencil, Trash2,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from 'lucide-react';
import './Pages.css';
import ProdutoFormModal from '../components/ProdutoFormModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

type PageResp = {
  content: Produto[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

type SortKey = 'nome' | 'precoVenda' | 'precoCusto' | 'quantidadeEstoque';

const formatPrice = (v?: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const Produtos = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [query, setQuery] = useState<string>('');
  const [debounced, setDebounced] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Modais (reaproveitados)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [produtoToEdit, setProdutoToEdit] = useState<Produto | null>(null);
  const [produtoToDelete, setProdutoToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Busca com debounce de 300ms; ao buscar, volta para a 1ª página
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(query.trim()); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const fetchProdutos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get<PageResp>('/produtos/pagina', {
        params: { page, size, q: debounced || undefined, sort: sortKey, dir: sortDir },
      });
      setProdutos(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch (err) {
      setError('Erro ao carregar produtos. Verifique se o backend está rodando.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, size, debounced, sortKey, sortDir]);

  useEffect(() => { fetchProdutos(); }, [fetchProdutos]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(0);
  };
  const seta = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');

  const openCreate = () => { setProdutoToEdit(null); setIsFormOpen(true); };
  const openEdit = (p: Produto) => { setProdutoToEdit(p); setIsFormOpen(true); };
  const openDelete = (id: number) => { setProdutoToDelete(id); setIsDeleteOpen(true); };
  const closeModals = () => {
    setIsFormOpen(false); setIsDeleteOpen(false);
    setProdutoToEdit(null); setProdutoToDelete(null);
  };
  const onFormSuccess = () => { closeModals(); fetchProdutos(); };

  const confirmDelete = async () => {
    if (produtoToDelete === null) return;
    setIsDeleting(true);
    try {
      await api.delete(`/produtos/${produtoToDelete}`);
      closeModals();
      // se era o último item da página, volta uma página; senão recarrega
      if (produtos.length === 1 && page > 0) setPage(p => p - 1);
      else fetchProdutos();
    } catch {
      alert('Erro ao excluir produto. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const de = totalElements === 0 ? 0 : page * size + 1;
  const ate = page * size + produtos.length;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Produtos</h1>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} />Novo Produto</button>
      </div>

      <div className="list-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Buscar produto por nome..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="size-select" value={size}
                onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}>
          <option value={20}>20 / página</option>
          <option value={50}>50 / página</option>
          <option value={100}>100 / página</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!error && (
        <>
          <div className="table-container scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => toggleSort('nome')}>Nome{seta('nome')}</th>
                  <th className="sortable" onClick={() => toggleSort('precoVenda')}>Preço Venda{seta('precoVenda')}</th>
                  <th className="sortable" onClick={() => toggleSort('precoCusto')}>Preço Custo{seta('precoCusto')}</th>
                  <th className="sortable" onClick={() => toggleSort('quantidadeEstoque')}>Estoque{seta('quantidadeEstoque')}</th>
                  <th>Un.</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Carregando...</td></tr>
                ) : produtos.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum produto encontrado.</td></tr>
                ) : produtos.map(p => (
                  <tr key={p.id}>
                    <td>{p.nome}</td>
                    <td>{formatPrice(p.precoVenda)}</td>
                    <td>{formatPrice(p.precoCusto)}</td>
                    <td>{p.quantidadeEstoque ?? '-'}</td>
                    <td>{p.unidadeMedida ?? 'UN'}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn-small btn-edit" title="Editar" onClick={() => openEdit(p)}><Pencil size={15} /></button>
                      <button className="btn-small btn-delete" title="Excluir" onClick={() => openDelete(p.id)}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span className="pg-info">
              Mostrando {de}–{ate} de {totalElements} produto(s)
            </span>
            <div className="pg-controls">
              <button className="pg-btn" title="Primeira" disabled={page <= 0} onClick={() => setPage(0)}><ChevronsLeft size={16} /></button>
              <button className="pg-btn" disabled={page <= 0} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} />Anterior</button>
              <span className="pg-current">Página {totalPages === 0 ? 0 : page + 1} de {totalPages}</span>
              <button className="pg-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próxima<ChevronRight size={16} /></button>
              <button className="pg-btn" title="Última" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}><ChevronsRight size={16} /></button>
            </div>
          </div>
        </>
      )}

      <ProdutoFormModal isOpen={isFormOpen} onClose={closeModals} onSuccess={onFormSuccess} produtoToEdit={produtoToEdit} />
      <ConfirmDeleteModal isOpen={isDeleteOpen} onClose={closeModals} onConfirm={confirmDelete} isLoading={isDeleting} />
    </div>
  );
};

export default Produtos;
