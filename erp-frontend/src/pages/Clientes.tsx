import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Cliente } from '../types';
import './Pages.css';

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  
  // Estado para controlar se estamos editando (guarda o ID) ou criando (null)
  const [editId, setEditId] = useState<number | null>(null);

  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    telefone: '',
    email: '',
    endereco: '',
    cpfCnpj: ''
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get<Cliente[]>('/clientes');
      setClientes(response.data);
    } catch (err) {
      setError('Erro ao carregar clientes. Verifique se o backend está rodando.');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      await api.delete(`/clientes/${id}`);
      setClientes(clientes.filter(cliente => cliente.id !== id));
      alert('Cliente excluído com sucesso!');
    } catch {
      alert('Erro ao excluir cliente. Tente novamente.');
    }
  };

  // Função para limpar o formulário e fechar o modal
  const resetModal = () => {
    setEditId(null);
    setNovoCliente({
      nome: '',
      telefone: '',
      email: '',
      endereco: '',
      cpfCnpj: ''
    });
    setShowModal(false);
  };

  // Função chamada ao clicar no botão "Editar" da tabela
  const handleEdit = (cliente: Cliente) => {
    setEditId(cliente.id);
    setNovoCliente({
      nome: cliente.nome,
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      endereco: cliente.endereco || '',
      cpfCnpj: cliente.cpfCnpj || ''
    });
    setShowModal(true);
  };

  // Função chamada ao clicar em "+ Novo Cliente"
  const handleOpenNew = () => {
    resetModal(); // Garante que está limpo
    setShowModal(true); // Abre
  };

  // Função unificada para Salvar (Criação ou Edição)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        // --- ATUALIZAR (PUT) ---
        const response = await api.put(`/clientes/${editId}`, novoCliente);
        
        // Atualiza a lista substituindo o antigo pelo novo
        setClientes(clientes.map(c => c.id === editId ? response.data : c));
        alert('Cliente atualizado com sucesso!');
      } else {
        // --- CRIAR (POST) ---
        const response = await api.post('/clientes', novoCliente);
        setClientes([...clientes, response.data]);
        alert('Cliente cadastrado com sucesso!');
      }
      
      resetModal();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar. Verifique os dados e tente novamente.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        {/* Agora chama handleOpenNew para garantir form limpo */}
        <button className="btn-primary" onClick={handleOpenNew}>+ Novo Cliente</button>
      </div>

      {loading && <div className="loading">Carregando clientes...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && clientes.length === 0 && (
        <div className="empty-state">
          <p>Nenhum cliente cadastrado.</p>
        </div>
      )}

      {!loading && !error && clientes.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.id}</td>
                  <td>{cliente.nome}</td>
                  <td>{cliente.email || '-'}</td>
                  <td>{cliente.telefone || '-'}</td>
                  <td>
                    {/* Botão Editar corrigido */}
                    <button className="btn-small btn-edit" onClick={() => handleEdit(cliente)}>Editar</button>
                    <button className="btn-small btn-delete" onClick={() => handleDelete(cliente.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL (Reutilizado para Criar e Editar) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
            <form onSubmit={handleSave} className="modal-form">
              <label>Nome</label>
              <input
                type="text"
                value={novoCliente.nome}
                onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                required
              />

              <label>Telefone</label>
              <input
                type="text"
                value={novoCliente.telefone}
                onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
              />

              <label>Email</label>
              <input
                type="email"
                value={novoCliente.email}
                onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
              />

              <label>Endereço</label>
              <input
                type="text"
                value={novoCliente.endereco}
                onChange={(e) => setNovoCliente({ ...novoCliente, endereco: e.target.value })}
              />

              <label>CPF/CNPJ</label>
              <input
                type="text"
                value={novoCliente.cpfCnpj}
                onChange={(e) => setNovoCliente({ ...novoCliente, cpfCnpj: e.target.value })}
              />

              <div className="modal-buttons">
                <button type="submit" className="btn-primary">Salvar</button>
                <button type="button" className="btn-secondary" onClick={resetModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;