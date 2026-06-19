import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Agendamento, Cliente, Veiculo } from '../types';
import { Plus, Check, Ban, Trash2 } from 'lucide-react';
import './Pages.css';

const hojeISO = () => new Date().toISOString().slice(0, 10);

const Agenda = () => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [dia, setDia] = useState<string>(hojeISO());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [novo, setNovo] = useState({
    box: '1', dataHoraInicio: '', dataHoraFim: '', descricao: '', clienteId: '', veiculoId: ''
  });

  useEffect(() => {
    fetchAux();
  }, []);

  useEffect(() => {
    fetchAgenda(dia);
  }, [dia]);

  const fetchAgenda = async (data: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get<Agendamento[]>('/agendamentos/periodo', {
        params: { inicio: `${data}T00:00:00`, fim: `${data}T23:59:59` },
      });
      setAgendamentos(res.data);
    } catch (err) {
      setError('Erro ao carregar a agenda.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAux = async () => {
    try {
      const [c, v] = await Promise.all([
        api.get<Cliente[]>('/clientes'),
        api.get<Veiculo[]>('/veiculos'),
      ]);
      setClientes(c.data);
      setVeiculos(v.data);
    } catch (err) {
      console.error(err);
    }
  };

  const horario = (iso: string) => iso ? iso.slice(11, 16) : '';

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      AGENDADO: 'badge badge-info',
      EM_ANDAMENTO: 'badge badge-warning',
      CONCLUIDO: 'badge badge-success',
      CANCELADO: 'badge badge-danger',
      NAO_COMPARECEU: 'badge badge-neutral',
    };
    return map[s] || 'badge badge-neutral';
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/agendamentos', {
        box: Number(novo.box),
        dataHoraInicio: novo.dataHoraInicio,
        dataHoraFim: novo.dataHoraFim || null,
        descricao: novo.descricao,
        clienteId: novo.clienteId ? Number(novo.clienteId) : null,
        veiculoId: novo.veiculoId ? Number(novo.veiculoId) : null,
      });
      setShowModal(false);
      setNovo({ box: '1', dataHoraInicio: '', dataHoraFim: '', descricao: '', clienteId: '', veiculoId: '' });
      fetchAgenda(dia);
    } catch (err: any) {
      alert(err?.response?.data || 'Erro ao criar agendamento.');
    }
  };

  const mudarStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/agendamentos/${id}/status`, null, { params: { status } });
      fetchAgenda(dia);
    } catch (err: any) {
      alert(err?.response?.data || 'Erro ao alterar status.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Excluir este agendamento?')) return;
    try {
      await api.delete(`/agendamentos/${id}`);
      fetchAgenda(dia);
    } catch {
      alert('Erro ao excluir agendamento.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Agenda / Box</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />Novo Agendamento</button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontWeight: 600, marginRight: '0.5rem' }}>Dia:</label>
        <input type="date" value={dia} onChange={(e) => setDia(e.target.value)}
               style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc' }} />
      </div>

      {loading && <div className="loading">Carregando agenda...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && agendamentos.length === 0 && (
        <div className="empty-state"><p>Nenhum agendamento para este dia.</p></div>
      )}

      {!loading && !error && agendamentos.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Box</th>
                <th>Horário</th>
                <th>Cliente</th>
                <th>Veículo</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map(a => (
                <tr key={a.id}>
                  <td><strong>Box {a.box}</strong></td>
                  <td>{horario(a.dataHoraInicio)} – {horario(a.dataHoraFim)}</td>
                  <td>{a.cliente?.nome || '-'}</td>
                  <td>{a.veiculo?.placa || '-'}</td>
                  <td>{a.descricao || '-'}</td>
                  <td><span className={statusBadge(a.status)}>{a.status}</span></td>
                  <td>
                    {a.status !== 'CONCLUIDO' && (
                      <button className="btn-small btn-edit" onClick={() => mudarStatus(a.id, 'CONCLUIDO')}><Check size={14} />Concluir</button>
                    )}
                    {a.status !== 'CANCELADO' && (
                      <button className="btn-small btn-secondary" onClick={() => mudarStatus(a.id, 'CANCELADO')}><Ban size={14} />Cancelar</button>
                    )}
                    <button className="btn-small btn-delete" title="Excluir" onClick={() => handleDelete(a.id)}><Trash2 size={15} /></button>
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
            <h2>Novo Agendamento</h2>
            <form onSubmit={handleCreate} className="modal-form">
              <label>Box</label>
              <input type="number" min="1" value={novo.box} required
                     onChange={(e) => setNovo({ ...novo, box: e.target.value })} />

              <label>Início</label>
              <input type="datetime-local" value={novo.dataHoraInicio} required
                     onChange={(e) => setNovo({ ...novo, dataHoraInicio: e.target.value })} />

              <label>Fim (opcional — default +1h)</label>
              <input type="datetime-local" value={novo.dataHoraFim}
                     onChange={(e) => setNovo({ ...novo, dataHoraFim: e.target.value })} />

              <label>Descrição</label>
              <input type="text" value={novo.descricao}
                     onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} />

              <label>Cliente (opcional)</label>
              <select value={novo.clienteId} onChange={(e) => setNovo({ ...novo, clienteId: e.target.value })}>
                <option value="">—</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>

              <label>Veículo (opcional)</label>
              <select value={novo.veiculoId} onChange={(e) => setNovo({ ...novo, veiculoId: e.target.value })}>
                <option value="">—</option>
                {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} {v.modelo ? `- ${v.modelo}` : ''}</option>)}
              </select>

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

export default Agenda;
