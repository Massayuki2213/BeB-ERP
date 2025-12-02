import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Cliente } from '../types';
import './Pages.css';

// --- Ícones Isolados (Para limpar o código principal) ---
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>;
const PlusIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [novoCliente, setNovoCliente] = useState({
    nome: '', telefone: '', email: '', endereco: '', cpfCnpj: ''
  });

  useEffect(() => { fetchClientes(); }, []);

  const fetchClientes = async () => {
    try {
      const response = await api.get<Cliente[]>('/clientes');
      setClientes(response.data);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        const res = await api.put(`/clientes/${editId}`, novoCliente);
        setClientes(clientes.map(c => c.id === editId ? res.data : c));
      } else {
        const res = await api.post('/clientes', novoCliente);
        setClientes([...clientes, res.data]);
      }
      resetModal();
    } catch (error) {
      alert('Erro ao salvar. Verifique os dados.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir cliente?')) return;
    try {
      await api.delete(`/clientes/${id}`);
      setClientes(clientes.filter(c => c.id !== id));
    } catch { alert('Erro ao excluir.'); }
  };

  const resetModal = () => {
    setEditId(null);
    setNovoCliente({ nome: '', telefone: '', email: '', endereco: '', cpfCnpj: '' });
    setShowModal(false);
  };

  const handleEdit = (c: Cliente) => {
    setEditId(c.id);
    setNovoCliente({ ...c, telefone: c.telefone || '', email: c.email || '', endereco: c.endereco || '', cpfCnpj: c.cpfCnpj || '' });
    setShowModal(true);
  };

  const filtered = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cpfCnpj?.includes(searchTerm)
  );

  return (
    <div className="page-container">
      {/* Cabeçalho */}
      <div className="page-header">
        <div className="page-title">
          <h1>Clientes</h1>
          <p>Gerencie sua base de contatos</p>
        </div>
        <button className="btn-primary" onClick={() => { resetModal(); setShowModal(true); }}>
          <PlusIcon /> Novo Cliente
        </button>
      </div>

      {/* Barra de Ferramentas (Busca) */}
      <div className="toolbar">
        <div className="search-box">
          <SearchIcon />
          <input 
            placeholder="Buscar por nome ou CPF..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="table-wrapper">
        {loading ? <div style={{padding: '2rem', textAlign: 'center'}}>Carregando...</div> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>CPF/CNPJ</th>
                <th className="col-actions">Ações</th> {/* Classe específica para alinhar */}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>Nenhum cliente encontrado.</td></tr>
              ) : filtered.map((cliente) => (
                <tr key={cliente.id}>
                  <td><strong>{cliente.nome}</strong></td>
                  <td>{cliente.email || '-'}</td>
                  <td>{cliente.telefone || '-'}</td>
                  <td>{cliente.cpfCnpj || '-'}</td>
                  <td className="col-actions">
                    <button className="btn-icon" onClick={() => handleEdit(cliente)} title="Editar"><EditIcon /></button>
                    <button className="btn-icon delete" onClick={() => handleDelete(cliente.id)} title="Excluir"><TrashIcon /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{margin: 0}}>{editId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
            
            <form onSubmit={handleSave} className="form-grid">
              <div className="form-group full-width">
                <label>Nome Completo</label>
                <input required value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} />
              </div>

              <div className="form-group">
                <label>CPF/CNPJ</label>
                <input value={novoCliente.cpfCnpj} onChange={e => setNovoCliente({...novoCliente, cpfCnpj: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Telefone</label>
                <input value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} />
              </div>

              <div className="form-group full-width">
                <label>Email</label>
                <input type="email" value={novoCliente.email} onChange={e => setNovoCliente({...novoCliente, email: e.target.value})} />
              </div>

              <div className="form-group full-width">
                <label>Endereço</label>
                <input value={novoCliente.endereco} onChange={e => setNovoCliente({...novoCliente, endereco: e.target.value})} />
              </div>

              <div className="modal-footer full-width">
                <button type="button" className="btn-secondary" onClick={resetModal}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;