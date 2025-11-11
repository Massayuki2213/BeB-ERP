import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Produto } from '../types';
import './Pages.css';
import ProductSearch from '../components/ProductSearch';
// Importe os novos componentes
import ProdutoFormModal from '../components/ProdutoFormModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const Produtos = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // --- Novos Estados para os Modais ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Guarda o produto que está sendo editado (ou null se for "criar")
  const [produtoToEdit, setProdutoToEdit] = useState<Produto | null>(null);
  
  // Guarda o ID do produto a ser excluído
  const [produtoToDelete, setProdutoToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // Loading do delete

  // --- Funções de Fetch (sem mudança) ---
  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get<Produto[]>('/produtos');
      setProdutos(response.data);
    } catch (err) {
      setError('Erro ao carregar produtos. Verifique se o backend está rodando.');
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

  // --- Funções de Abertura dos Modais ---
  
  // Abre o modal de "Novo Produto"
  const handleOpenCreateModal = () => {
    setProdutoToEdit(null); // Garante que não há produto selecionado
    setIsFormModalOpen(true);
  };

  // Abre o modal de "Editar Produto"
  const handleOpenEditModal = (produto: Produto) => {
    setProdutoToEdit(produto); // Define o produto para edição
    setIsFormModalOpen(true);
  };

  // Abre o modal de "Confirmar Exclusão"
  const handleOpenDeleteModal = (id: number) => {
    setProdutoToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Fecha todos os modais e reseta os estados
  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setProdutoToEdit(null);
    setProdutoToDelete(null);
  };

  // Chamado quando o formulário é salvo com sucesso
  const handleFormSuccess = () => {
    handleCloseModals();
    fetchProdutos(); // Recarrega a lista de produtos
  };

  // --- Função de Delete (Atualizada) ---
  const handleDeleteConfirm = async () => {
    if (produtoToDelete === null) return;

    setIsDeleting(true);
    try {
      await api.delete(`/produtos/${produtoToDelete}`);
      // Remove da lista localmente (melhora a UI)
      setProdutos(produtos.filter(p => p.id !== produtoToDelete));
      handleCloseModals();
      // alert('Produto excluído com sucesso!'); // Opcional
    } catch {
      alert('Erro ao excluir produto. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Renderização do Componente ---
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Produtos</h1>
        {/* Atualizado para abrir o modal de criação */}
        <button className="btn-primary" onClick={handleOpenCreateModal}>
          + Novo Produto
        </button>
      </div>

      {loading && <div className="loading">Carregando produtos...</div>}
      
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && produtos.length === 0 && (
        <div className="empty-state">
          <p>Nenhum produto cadastrado.</p>
        </div>
      )}
      <ProductSearch />
      {!loading && !error && produtos.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Preço</th>
                <th>Preço Custo</th>
                <th>Quantidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id}>
                  <td>{produto.id}</td>
                  <td>{produto.nome}</td>
                  <td>{formatPrice(produto.precoVenda)}</td>
                  <td>{formatPrice(produto.precoCusto)}</td>
                  <td>{produto.quantidadeEstoque || '-'}</td>
                  <td>
                    {/* Atualizado para abrir o modal de edição */}
                    <button className="btn-small btn-edit" onClick={() => handleOpenEditModal(produto)}>
                      Editar
                    </button>
                    {/* Atualizado para abrir o modal de confirmação */}
                    <button className="btn-small btn-delete" onClick={() => handleOpenDeleteModal(produto.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Renderização dos Modais (eles ficam invisíveis até serem abertos) --- */}
      
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