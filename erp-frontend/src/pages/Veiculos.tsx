import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Veiculo, Cliente } from '../types';
import { Plus, Trash2 } from 'lucide-react';
import './Pages.css';

const Veiculos = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [filtroCliente, setFiltroCliente] = useState<string>('');
  const [novo, setNovo] = useState({
    clienteId: '', placa: '', marca: '', modelo: '', ano: '', cor: ''
  });

  useEffect(() => {
    fetchClientes();
    fetchVeiculos();
  }, []);

  const fetchVeiculos = async (clienteId?: string) => {
    try {
      setLoading(true);
      setError('');
      const url = clienteId ? `/veiculos/cliente/${clienteId}` : '/veiculos';
      const res = await api.get<Veiculo[]>(url);
      setVeiculos(res.data);
    } catch (err) {
      setError('Erro ao carregar veículos. Verifique se o backend está rodando.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await api.get<Cliente[]>('/clientes');
      setClientes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFiltro = (clienteId: string) => {
    setFiltroCliente(clienteId);
    fetchVeiculos(clienteId || undefined);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/veiculos', {
        clienteId: Number(novo.clienteId),
        placa: novo.placa,
        marca: novo.marca,
        modelo: novo.modelo,
        ano: novo.ano ? Number(novo.ano) : null,
        cor: novo.cor,
      });
      setShowModal(false);
      setNovo({ clienteId: '', placa: '', marca: '', modelo: '', ano: '', cor: '' });
      fetchVeiculos(filtroCliente || undefined);
    } catch (err: any) {
      alert(err?.response?.data || 'Erro ao cadastrar veículo.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Excluir este veículo?')) return;
    try {
      await api.delete(`/veiculos/${id}`);
      setVeiculos(veiculos.filter(v => v.id !== id));
    } catch {
      alert('Erro ao excluir veículo.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Veículos</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />Novo Veículo</button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontWeight: 600, marginRight: '0.5rem' }}>Histórico do cliente:</label>
        <select value={filtroCliente} onChange={(e) => handleFiltro(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc' }}>
          <option value="">Todos os veículos</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {loading && <div className="loading">Carregando veículos...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && veiculos.length === 0 && (
        <div className="empty-state"><p>Nenhum veículo encontrado.</p></div>
      )}

      {!loading && !error && veiculos.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Ano</th>
                <th>Cor</th>
                <th>Cliente</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {veiculos.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.placa}</strong></td>
                  <td>{v.marca || '-'}</td>
                  <td>{v.modelo || '-'}</td>
                  <td>{v.ano || '-'}</td>
                  <td>{v.cor || '-'}</td>
                  <td>{v.cliente?.nome || '-'}</td>
                  <td>
                    <button className="btn-small btn-delete" title="Excluir" onClick={() => handleDelete(v.id)}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Novo Veículo</h2>
            <form onSubmit={handleCreate} className="modal-form">
              <label>Cliente</label>
              <select value={novo.clienteId} required
                      onChange={(e) => setNovo({ ...novo, clienteId: e.target.value })}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>

              <label>Placa</label>
              <input type="text" value={novo.placa} required
                     onChange={(e) => setNovo({ ...novo, placa: e.target.value.toUpperCase() })} />

              <label>Marca</label>
              <input type="text" value={novo.marca}
                     onChange={(e) => setNovo({ ...novo, marca: e.target.value })} />

              <label>Modelo</label>
              <input type="text" value={novo.modelo}
                     onChange={(e) => setNovo({ ...novo, modelo: e.target.value })} />

              <label>Ano</label>
              <input type="number" value={novo.ano}
                     onChange={(e) => setNovo({ ...novo, ano: e.target.value })} />

              <label>Cor</label>
              <input type="text" value={novo.cor}
                     onChange={(e) => setNovo({ ...novo, cor: e.target.value })} />

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

export default Veiculos;
