// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Package, Wrench, TrendingUp, TrendingDown, ClipboardList, Calendar, RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import type {
  ResumoFinanceiro, FluxoCaixaDia, LancamentoFinanceiro, OrdemServico, Agendamento,
} from '../types';
import './Pages.css';

const formatPrice = (v?: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const inicioMes = () => { const d = new Date(); return isoDate(new Date(d.getFullYear(), d.getMonth(), 1)); };
const fimMes = () => { const d = new Date(); return isoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };
const ddMM = (iso: string) => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '';

const Dashboard = () => {
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [fluxo, setFluxo] = useState<FluxoCaixaDia[]>([]);
  const [aReceber, setAReceber] = useState<LancamentoFinanceiro[]>([]);
  const [aPagar, setAPagar] = useState<LancamentoFinanceiro[]>([]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [agendaHoje, setAgendaHoje] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregar = async () => {
    setLoading(true);
    setErro(null);
    const inicio = inicioMes(), fim = fimMes(), hoje = isoDate(new Date());
    try {
      const [r, f, ar, ap, os, ag] = await Promise.all([
        api.get<ResumoFinanceiro>('/financeiro/resumo', { params: { inicio, fim } }),
        api.get<FluxoCaixaDia[]>('/financeiro/fluxo-caixa', { params: { inicio, fim } }),
        api.get<LancamentoFinanceiro[]>('/financeiro/contas-a-receber'),
        api.get<LancamentoFinanceiro[]>('/financeiro/contas-a-pagar'),
        api.get<OrdemServico[]>('/ordens-servico'),
        api.get<Agendamento[]>('/agendamentos/periodo', { params: { inicio: `${hoje}T00:00:00`, fim: `${hoje}T23:59:59` } }),
      ]);
      setResumo(r.data);
      setFluxo(f.data);
      setAReceber(ar.data);
      setAPagar(ap.data);
      setOrdens(os.data);
      setAgendaHoje(ag.data);
    } catch (err) {
      console.error(err);
      setErro('Erro ao carregar o dashboard. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const soma = (ls: LancamentoFinanceiro[]) => ls.reduce((s, l) => s + Number(l.valor || 0), 0);
  const osAbertas = ordens.filter(o => o.status !== 'FINALIZADA' && o.status !== 'CANCELADA');
  const osFinalizadas = ordens
    .filter(o => o.status === 'FINALIZADA')
    .sort((a, b) => (b.dataFechamento || '').localeCompare(a.dataFechamento || ''))
    .slice(0, 8);
  const maxFluxo = Math.max(1, ...fluxo.map(d => Math.max(d.entradas, d.saidas)));

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title">Dashboard</h1>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <button className="btn-primary" onClick={carregar}><RefreshCw size={16} />Atualizar</button>
      </div>

      {erro && <div className="error-message">{erro}</div>}

      {/* KPIs financeiros (mês) */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-icon"><Wallet size={22} /></div>
          <div className="card-content">
            <h3>Saldo do Mês</h3>
            <p className="card-value">{formatPrice(resumo?.saldo)}</p>
            <p className="card-label">Entradas {formatPrice(resumo?.totalEntradas)} • Saídas {formatPrice(resumo?.totalSaidas)}</p>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="card-icon"><Package size={22} /></div>
          <div className="card-content">
            <h3>Lucro Peças</h3>
            <p className="card-value">{formatPrice(resumo?.lucroPecas)}</p>
            <p className="card-label">Receita {formatPrice(resumo?.receitaPecas)}</p>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="card-icon"><Wrench size={22} /></div>
          <div className="card-content">
            <h3>Lucro Serviços</h3>
            <p className="card-value">{formatPrice(resumo?.lucroServicos)}</p>
            <p className="card-label">Receita {formatPrice(resumo?.receitaServicos)}</p>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="card-icon"><TrendingUp size={22} /></div>
          <div className="card-content">
            <h3>A Receber</h3>
            <p className="card-value">{formatPrice(soma(aReceber))}</p>
            <p className="card-label">{aReceber.length} em aberto</p>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="card-icon"><TrendingDown size={22} /></div>
          <div className="card-content">
            <h3>A Pagar</h3>
            <p className="card-value">{formatPrice(soma(aPagar))}</p>
            <p className="card-label">{aPagar.length} em aberto</p>
          </div>
        </div>
      </div>

      {/* KPIs operação */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-icon"><ClipboardList size={22} /></div>
          <div className="card-content">
            <h3>OS em Aberto</h3>
            <p className="card-value">{osAbertas.length}</p>
            <p className="card-label"><Link to="/ordens-servico">ver ordens</Link></p>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="card-icon"><Calendar size={22} /></div>
          <div className="card-content">
            <h3>Agenda de Hoje</h3>
            <p className="card-value">{agendaHoje.length}</p>
            <p className="card-label"><Link to="/agenda">ver agenda</Link></p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
        {/* Fluxo de caixa diário */}
        <div>
          <h2 style={{ fontSize: '1.2rem' }}>Fluxo de Caixa Diário (mês)</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Dia</th><th>Entradas</th><th>Saídas</th><th>Saldo</th><th>Movimento</th></tr>
              </thead>
              <tbody>
                {fluxo.length === 0 ? <tr><td colSpan={5}>Sem movimento no período.</td></tr> :
                  fluxo.map(d => (
                    <tr key={d.data}>
                      <td>{ddMM(d.data)}</td>
                      <td style={{ color: '#16a34a' }}>{formatPrice(d.entradas)}</td>
                      <td style={{ color: '#dc2626' }}>{formatPrice(d.saidas)}</td>
                      <td><strong>{formatPrice(d.saldoDia)}</strong></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 120 }}>
                          <div style={{ height: 6, borderRadius: 3, background: '#16a34a', width: `${(d.entradas / maxFluxo) * 100}%` }} />
                          <div style={{ height: 6, borderRadius: 3, background: '#dc2626', width: `${(d.saidas / maxFluxo) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gatilhos de garantia / upgrade */}
        <div>
          <h2 style={{ fontSize: '1.2rem' }}>Retorno (garantia / upgrade)</h2>
          <p style={{ color: '#6b7280', marginTop: 0, fontSize: '0.9rem' }}>
            Últimas OS finalizadas — clientes para acionar garantia ou oferecer upgrade.
          </p>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>OS</th><th>Cliente</th><th>Veículo</th><th>Fechada em</th><th>Total</th></tr>
              </thead>
              <tbody>
                {osFinalizadas.length === 0 ? <tr><td colSpan={5}>Nenhuma OS finalizada ainda.</td></tr> :
                  osFinalizadas.map(o => (
                    <tr key={o.id}>
                      <td>#{o.id}</td>
                      <td>{o.cliente?.nome || '-'}</td>
                      <td>{o.veiculo?.placa || '-'}</td>
                      <td>{o.dataFechamento ? o.dataFechamento.slice(0, 10) : '-'}</td>
                      <td>{formatPrice(o.valorTotal)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
