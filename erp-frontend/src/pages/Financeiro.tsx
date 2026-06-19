import { useState, useEffect } from 'react';
import { Package, Wrench, Wallet, Plus, Check } from 'lucide-react';
import api from '../services/api';
import type { LancamentoFinanceiro, ResumoFinanceiro } from '../types';
import './Pages.css';

const formatPrice = (v?: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    LIQUIDADO: 'badge badge-success',
    PENDENTE: 'badge badge-warning',
    CANCELADO: 'badge badge-neutral',
  };
  return map[s] || 'badge badge-neutral';
};

const inicioMes = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); };
const fimMes = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10); };

const Financeiro = () => {
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [aPagar, setAPagar] = useState<LancamentoFinanceiro[]>([]);
  const [aReceber, setAReceber] = useState<LancamentoFinanceiro[]>([]);
  const [inicio, setInicio] = useState<string>(inicioMes());
  const [fim, setFim] = useState<string>(fimMes());
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [novo, setNovo] = useState({
    tipo: 'DESPESA', descricao: '', valor: '', status: 'LIQUIDADO', dataVencimento: '', formaPagamento: ''
  });

  useEffect(() => { fetchListas(); }, []);
  useEffect(() => { fetchResumo(); }, [inicio, fim]);

  const fetchResumo = async () => {
    try {
      const res = await api.get<ResumoFinanceiro>('/financeiro/resumo', { params: { inicio, fim } });
      setResumo(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchListas = async () => {
    try {
      setLoading(true);
      const [l, p, r] = await Promise.all([
        api.get<LancamentoFinanceiro[]>('/financeiro/lancamentos'),
        api.get<LancamentoFinanceiro[]>('/financeiro/contas-a-pagar'),
        api.get<LancamentoFinanceiro[]>('/financeiro/contas-a-receber'),
      ]);
      setLancamentos(l.data);
      setAPagar(p.data);
      setAReceber(r.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const recarregar = () => { fetchListas(); fetchResumo(); };

  const liquidar = async (id: number) => {
    try { await api.patch(`/financeiro/lancamentos/${id}/liquidar`); recarregar(); }
    catch { alert('Erro ao liquidar.'); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/financeiro/lancamentos', {
        tipo: novo.tipo,
        descricao: novo.descricao,
        valor: Number(novo.valor),
        status: novo.status,
        dataVencimento: novo.dataVencimento || null,
        formaPagamento: novo.formaPagamento || null,
      });
      setShowModal(false);
      setNovo({ tipo: 'DESPESA', descricao: '', valor: '', status: 'LIQUIDADO', dataVencimento: '', formaPagamento: '' });
      recarregar();
    } catch (err: any) {
      alert(err?.response?.data || 'Erro ao criar lançamento.');
    }
  };

  const renderConta = (l: LancamentoFinanceiro) => (
    <tr key={l.id}>
      <td>{l.descricao}</td>
      <td>{formatPrice(l.valor)}</td>
      <td>{l.dataVencimento || '-'}</td>
      <td><button className="btn-small btn-edit" onClick={() => liquidar(l.id)}><Check size={14} />Liquidar</button></td>
    </tr>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Financeiro</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />Lançamento</button>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <label style={{ fontWeight: 600 }}>Período:</label>
        <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)}
               style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc' }} />
        <span>até</span>
        <input type="date" value={fim} onChange={(e) => setFim(e.target.value)}
               style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc' }} />
      </div>

      {resumo && (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="card-icon"><Package size={22} /></span>
            <div className="card-content">
              <h3>Lucro Peças</h3>
              <p className="card-value">{formatPrice(resumo.lucroPecas)}</p>
              <p className="card-label">Receita {formatPrice(resumo.receitaPecas)} − custo {formatPrice(resumo.custoPecas)}</p>
            </div>
          </div>
          <div className="dashboard-card">
            <span className="card-icon"><Wrench size={22} /></span>
            <div className="card-content">
              <h3>Lucro Serviços</h3>
              <p className="card-value">{formatPrice(resumo.lucroServicos)}</p>
              <p className="card-label">Receita {formatPrice(resumo.receitaServicos)} − repasses {formatPrice(resumo.repasses)}</p>
            </div>
          </div>
          <div className="dashboard-card">
            <span className="card-icon"><Wallet size={22} /></span>
            <div className="card-content">
              <h3>Saldo do Período</h3>
              <p className="card-value">{formatPrice(resumo.saldo)}</p>
              <p className="card-label">Entradas {formatPrice(resumo.totalEntradas)} − saídas {formatPrice(resumo.totalSaidas)}</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem' }}>Contas a Pagar</h2>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Descrição</th><th>Valor</th><th>Vencimento</th><th></th></tr></thead>
              <tbody>
                {aPagar.length === 0 ? <tr><td colSpan={4}>Nada a pagar.</td></tr> : aPagar.map(renderConta)}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem' }}>Contas a Receber</h2>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Descrição</th><th>Valor</th><th>Vencimento</th><th></th></tr></thead>
              <tbody>
                {aReceber.length === 0 ? <tr><td colSpan={4}>Nada a receber.</td></tr> : aReceber.map(renderConta)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.2rem' }}>Lançamentos</h2>
      {loading && <div className="loading">Carregando...</div>}
      {!loading && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Origem</th></tr>
            </thead>
            <tbody>
              {lancamentos.length === 0 ? <tr><td colSpan={7}>Nenhum lançamento.</td></tr> :
                lancamentos.map(l => (
                  <tr key={l.id}>
                    <td>{l.data}</td>
                    <td>{l.tipo}</td>
                    <td>{l.categoria}</td>
                    <td>{l.descricao}</td>
                    <td style={{ color: l.tipo === 'RECEITA' ? '#16a34a' : '#dc2626' }}>
                      {l.tipo === 'RECEITA' ? '+' : '−'} {formatPrice(l.valor)}
                    </td>
                    <td><span className={statusBadge(l.status)}>{l.status}</span></td>
                    <td>{l.origem}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Novo Lançamento</h2>
            <form onSubmit={handleCreate} className="modal-form">
              <label>Tipo</label>
              <select value={novo.tipo} onChange={(e) => setNovo({ ...novo, tipo: e.target.value })}>
                <option value="DESPESA">Despesa</option>
                <option value="RECEITA">Receita</option>
              </select>

              <label>Descrição</label>
              <input type="text" value={novo.descricao} required
                     onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} />

              <label>Valor</label>
              <input type="number" step="0.01" value={novo.valor} required
                     onChange={(e) => setNovo({ ...novo, valor: e.target.value })} />

              <label>Situação</label>
              <select value={novo.status} onChange={(e) => setNovo({ ...novo, status: e.target.value })}>
                <option value="LIQUIDADO">Já pago/recebido</option>
                <option value="PENDENTE">Em aberto (conta a pagar/receber)</option>
              </select>

              {novo.status === 'PENDENTE' && (
                <>
                  <label>Vencimento</label>
                  <input type="date" value={novo.dataVencimento}
                         onChange={(e) => setNovo({ ...novo, dataVencimento: e.target.value })} />
                </>
              )}

              <label>Forma de pagamento (opcional)</label>
              <input type="text" value={novo.formaPagamento}
                     onChange={(e) => setNovo({ ...novo, formaPagamento: e.target.value })} />

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

export default Financeiro;
