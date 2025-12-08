import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Servico } from '../types';
import './Pages.css';
// Importação do CSS de ProductSearch não é necessária aqui, mas mantenha Pages.css

// --- ÍCONES (Copie essas definições para Servicos.tsx) ---
// Se você tiver esses ícones em um arquivo de componentes, importe de lá.
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const PlusIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

const Servicos = () => {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Estados para modais de CRUD (A serem implementados, mas necessários para o estilo)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [servicoToEdit, setServicoToEdit] = useState<Servico | null>(null);
  const [servicoToDelete, setServicoToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchServicos();
  }, []);

  const fetchServicos = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get<Servico[]>('/servicos');
      setServicos(Array.isArray(response.data) ? response.data : []);
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

  // --- Handlers de Ação (Apenas para o botão funcionar) ---
  const handleOpenCreate = () => { setServicoToEdit(null); setIsFormModalOpen(true); /* Implementar modal */ };
  const handleOpenEdit = (s: Servico) => { setServicoToEdit(s); setIsFormModalOpen(true); /* Implementar modal */ };
  const handleOpenDelete = (id: number) => { setServicoToDelete(id); setIsDeleteModalOpen(true); /* Implementar modal */ };


  return (
    <div className="page-container">
      {/* HEADER REVISADO */}
      <div className="page-header">
        <div className="page-title">
          <h1>Gerenciar Serviços</h1> {/* Título mais descritivo */}
          <p>Visualize e gerencie seus serviços</p> {/* Subtítulo para melhor estilo */}
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          <PlusIcon /> Novo Serviço {/* Adicionado ícone */}
        </button>
      </div>
      
      {/* Aqui você pode adicionar um componente de filtros se precisar, como em Produtos.tsx */}

      {loading && <div className="loading" style={{padding: '2rem', textAlign: 'center'}}>Carregando serviços...</div>}
      
      {error && <div className="error-message" style={{color: 'red', padding: '1rem'}}>{error}</div>}

      {!loading && !error && servicos.length === 0 && (
        <div className="empty-state" style={{textAlign: 'center', padding: '2rem'}}>
          <p>Nenhum serviço cadastrado.</p>
        </div>
      )}

      {!loading && !error && servicos.length > 0 && (
        // TABLE WRAPPER ADICIONADO AQUI
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {/* Cabeçalhos com o mesmo estilo (uppercase, etc.) */}
                <th>ID</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Preço</th>
                <th className="col-actions">Ações</th> {/* ADICIONADO: col-actions */}
              </tr>
            </thead>
            <tbody>
              {servicos.map((servico) => (
                <tr key={servico.id}>
                  <td>#{servico.id}</td> {/* Usando # como em Produtos */}
                  <td style={{fontWeight: 500}}>{servico.nome}</td> {/* Estilo em negrito para nome */}
                  <td>{servico.descricao || '—'}</td> {/* Usando traço longo para ausência */}
                  <td>{formatPrice(servico.valorBase)}</td>
                  {/* AÇÕES REVISADAS */}
                  <td className="col-actions">
                    <button className="btn-icon" onClick={() => handleOpenEdit(servico)} title="Editar">
                      <EditIcon />
                    </button>
                    <button className="btn-icon delete" onClick={() => handleOpenDelete(servico.id)} title="Excluir">
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Implementar ModalFormModal e ConfirmDeleteModal aqui, como em Produtos.tsx, se desejar o comportamento completo. */}
    </div>
  );
};

export default Servicos;