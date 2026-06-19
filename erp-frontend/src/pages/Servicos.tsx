import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Servico } from '../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import './Pages.css';

const emptyForm = { nome: '', descricao: '', valorBase: '', categoria: '' };

const Servicos = () => {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (s: Servico) => {
    setEditId(s.id);
    setForm({
      nome: s.nome,
      descricao: s.descricao || '',
      valorBase: String(s.valorBase ?? ''),
      categoria: s.categoria || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nome: form.nome,
      descricao: form.descricao,
      valorBase: form.valorBase ? Number(form.valorBase) : 0,
      categoria: form.categoria,
    };
    try {
      if (editId === null) {
        await api.post('/servicos', payload);
      } else {
        await api.patch(`/servicos/${editId}`, payload);
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditId(null);
      fetchServicos();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data || 'Erro ao salvar serviço. Tente novamente.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este serviço?')) return;
    try {
      await api.delete(`/servicos/${id}`);
      setServicos(servicos.filter(s => s.id !== id));
    } catch {
      alert('Erro ao excluir serviço. Tente novamente.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Serviços</h1>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} />Novo Serviço</button>
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
                <th>Nome</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor base</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {servicos.map((servico) => (
                <tr key={servico.id}>
                  <td>{servico.nome}</td>
                  <td>{servico.descricao || '-'}</td>
                  <td>{servico.categoria || '-'}</td>
                  <td>{formatPrice(servico.valorBase)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn-small btn-edit" title="Editar" onClick={() => openEdit(servico)}><Pencil size={15} /></button>
                    <button className="btn-small btn-delete" title="Excluir" onClick={() => handleDelete(servico.id)}><Trash2 size={15} /></button>
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
            <h2>{editId === null ? 'Novo Serviço' : 'Editar Serviço'}</h2>
            <form onSubmit={handleSave} className="modal-form">
              <label>Nome</label>
              <input type="text" value={form.nome} required
                     onChange={(e) => setForm({ ...form, nome: e.target.value })} />

              <label>Descrição</label>
              <input type="text" value={form.descricao}
                     onChange={(e) => setForm({ ...form, descricao: e.target.value })} />

              <label>Categoria</label>
              <input type="text" value={form.categoria} placeholder="Ex.: Áudio, Película, Elétrica"
                     onChange={(e) => setForm({ ...form, categoria: e.target.value })} />

              <label>Valor base (R$)</label>
              <input type="number" step="0.01" min="0" value={form.valorBase} required
                     onChange={(e) => setForm({ ...form, valorBase: e.target.value })} />

              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Servicos;
