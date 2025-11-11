import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Cliente } from '../types';
import './Pages.css';

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/clientes', novoCliente);
      setClientes([...clientes, response.data]);
      alert('Cliente cadastrado com sucesso!');
      setShowModal(false);
      setNovoCliente({
        nome: '',
        telefone: '',
        email: '',
        endereco: '',
        cpfCnpj: ''
      });
    } catch (error) {
      console.error(error);
      alert('Erro ao cadastrar cliente. Tente novamente.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Novo Cliente</button>
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
                    <button className="btn-small btn-edit">Editar</button>
                    <button className="btn-small btn-delete" onClick={() => handleDelete(cliente.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Novo Cliente</h2>
            <form onSubmit={handleCreate} className="modal-form">
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
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
