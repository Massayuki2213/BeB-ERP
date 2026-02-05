import { useState, useEffect } from 'react';
import api from '../services/api';
// Importe os ícones do pacote que instalamos
import { Search, Plus, Edit, Trash2, X } from 'lucide-react';
import './Pages.css';

// Interface (se não tiver no arquivo types, mantenha aqui ou mova para types.ts)
interface Cliente {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  cpfCnpj?: string;
  endereco?: string;
}

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
      alert('Erro ao carregar clientes');
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
    setNovoCliente({ 
      nome: c.nome, 
      telefone: c.telefone || '', 
      email: c.email || '', 
      endereco: c.endereco || '', 
      cpfCnpj: c.cpfCnpj || '' 
    });
    setShowModal(true);
  };

  const filtered = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.cpfCnpj && c.cpfCnpj.includes(searchTerm))
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
          <Plus size={20} style={{ marginRight: 8 }} /> Novo Cliente
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            placeholder="Buscar por nome ou CPF..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="table-wrapper">
        {loading ? <div className="loading-state">Carregando...</div> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>CPF/CNPJ</th>
                <th className="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">Nenhum cliente encontrado.</td></tr>
              ) : filtered.map((cliente) => (
                <tr key={cliente.id}>
                  <td><strong>{cliente.nome}</strong></td>
                  <td>{cliente.email || '-'}</td>
                  <td>{cliente.telefone || '-'}</td>
                  <td>{cliente.cpfCnpj || '-'}</td>
                  <td className="col-actions">
                    <button className="btn-icon" onClick={() => handleEdit(cliente)} title="Editar">
                      <Edit size={18} />
                    </button>
                    <button className="btn-icon delete" onClick={() => handleDelete(cliente.id)} title="Excluir">
                      <Trash2 size={18} />
                    </button>
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
            <div className="modal-header">
              <h2>{editId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button className="btn-close" onClick={resetModal}><X size={20} /></button>
            </div>
            
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