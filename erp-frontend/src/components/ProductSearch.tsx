import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import type { Produto } from '../types';
import './ProductSearch.css';

type SortKey = 'id' | 'nome' | 'precoVenda' | 'quantidadeEstoque';
type SortOrder = 'asc' | 'desc';

const ProductSearch: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [debouncedQuery, setDebouncedQuery] = useState<string>(query);

  // debounce simples 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<Produto[]>('/produtos');
        setProdutos(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        console.error('Erro ao carregar produtos:', err);
        setError('Erro ao carregar produtos. Veja console.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // filtro que busca em id, nome, precoVenda e quantidadeEstoque
  const filtered = useMemo(() => {
    if (!debouncedQuery) return produtos;
    const q = debouncedQuery.toLowerCase();

    const onlyNumber = /^\d+(\.\d+)?$/.test(q.replace(',', '.'));

    return produtos.filter(p => {
      if (String(p.id).toLowerCase().includes(q)) return true;
      if (p.nome && p.nome.toLowerCase().includes(q)) return true;
      if (p.quantidadeEstoque !== undefined && String(p.quantidadeEstoque).toLowerCase().includes(q)) return true;
      const precoStr = String((p.precoVenda ?? 0)).toLowerCase();
      if (precoStr.includes(q.replace(',', '.'))) return true;
      if (onlyNumber) {
        const asNum = Number(q.replace(',', '.'));
        if (!Number.isNaN(asNum) && Math.abs((p.precoVenda ?? 0) - asNum) < 0.0001) return true;
      }
      return false;
    });
  }, [produtos, debouncedQuery]);

  // ordenação
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let va: any = a[sortKey];
      let vb: any = b[sortKey];

      if (va === undefined || va === null) va = '';
      if (vb === undefined || vb === null) vb = '';

      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();

      if (va < vb) return sortOrder === 'asc' ? -1 : 1;
      if (va > vb) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const formatPrice = (price?: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price ?? 0);

  return (
    <div className="product-search">
      <div className="ps-header">
        <h3>Produtos</h3>
        <div className="ps-controls">
          <input
            type="text"
            placeholder="Pesquisar por nome, id, preço ou quantidade..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="ps-input"
          />
        </div>
      </div>

      {loading ? (
        <p>Carregando produtos...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <div className="ps-meta">
            <span>{sorted.length} produto(s) encontrados</span>
          </div>

          <table className="ps-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('id')} className="clickable">
                  ID {sortKey === 'id' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => toggleSort('nome')} className="clickable">
                  Nome {sortKey === 'nome' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => toggleSort('precoVenda')} className="clickable">
                  Preço {sortKey === 'precoVenda' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => toggleSort('quantidadeEstoque')} className="clickable">
                  Estoque {sortKey === 'quantidadeEstoque' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td className="ps-name">{p.nome}</td>
                  <td>{formatPrice(p.precoVenda)}</td>
                  <td>{p.quantidadeEstoque ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default ProductSearch;
