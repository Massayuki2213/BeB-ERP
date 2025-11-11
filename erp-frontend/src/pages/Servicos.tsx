import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Servico } from '../types';
import './Pages.css';

const Servicos = () => {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchServicos();
  }, []);

  const fetchServicos = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get<Servico[]>('/servicos');
      setServicos(response.data);
    } catch (err) {
      setError('Erro ao carregar serviços. Verifique se o backend está rodando.');
      console.error('Erro:', err);
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
      <div className="page-header">
        <h1 className="page-title">Serviços</h1>
        <button className="btn-primary">+ Novo Serviço</button>
      </div>

      {loading && <div className="loading">Carregando serviços...</div>}
      
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && servicos.length === 0 && (
        <div className="empty-state">
          <p>Nenhum serviço cadastrado.</p>
        </div>
      )}

      {!loading && !error && servicos.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Preço</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {servicos.map((servico) => (
                <tr key={servico.id}>
                  <td>{servico.id}</td>
                  <td>{servico.nome}</td>
                  <td>{servico.descricao || '-'}</td>
                  <td>{formatPrice(servico.valorBase)}</td>
                  <td>
                    <button className="btn-small btn-edit">Editar</button>
                    <button className="btn-small btn-delete">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Servicos;