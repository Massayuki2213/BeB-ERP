// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import api from '../services/api';
import './Pages.css';

type TotaisResponse = { [forma: string]: number };

const Dashboard = () => {
  const [qtdProdutos, setQtdProdutos] = useState<number>(0);
  const [qtdClientes, setQtdClientes] = useState<number>(0);
  const [qtdServicos, setQtdServicos] = useState<number>(0);
  const [totalDinheiro, setTotalDinheiro] = useState<number>(0);
  const [totalPix, setTotalPix] = useState<number>(0);
  const [totalGeral, setTotalGeral] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatPrice = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const getMonthRange = () => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    // backend espera "yyyy-MM-ddTHH:mm:ss" (sem Z)
    const fmt = (d: Date) => d.toISOString().slice(0, 19);
    return { start: fmt(start), end: fmt(end) };
  };

  const carregarDashboard = async () => {
    setLoading(true);
    setErro(null);
    try {
      // 1) buscar contagens simples
      const [prodRes, cliRes, servRes] = await Promise.all([
        api.get('/produtos'),
        api.get('/clientes'),
        api.get('/servicos'),
      ]);
      setQtdProdutos(Array.isArray(prodRes.data) ? prodRes.data.length : 0);
      setQtdClientes(Array.isArray(cliRes.data) ? cliRes.data.length : 0);
      setQtdServicos(Array.isArray(servRes.data) ? servRes.data.length : 0);

      // 2) buscar faturamento - preferir endpoint específico se existir
      const { start, end } = getMonthRange();

      // TENTATIVA A: endpoint resumido no backend (recomendado)
      try {
        const totalsResp = await api.get<TotaisResponse>(`/dashboard/totais?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
        const data = totalsResp.data || {};
        const din = Number(data.DINHEIRO || data.dinheiro || 0);
        const pix = Number(data.PIX || data.pix || 0);
        setTotalDinheiro(din);
        setTotalPix(pix);
        setTotalGeral(din + pix);
      } catch (err) {
        // Se endpoint /dashboard/totais não existir, caimos no fallback (opção B)
        console.warn('Endpoint /dashboard/totais indisponível — usando fallback por ordens-venda', err);
        await carregarFaturamentoPorOrdens(start, end);
      }
    } catch (err: any) {
      console.error(err);
      setErro('Erro ao carregar dashboard. Veja console para detalhes.');
    } finally {
      setLoading(false);
    }
  };

  // Fallback: pega ordens e agrupa no frontend
  const carregarFaturamentoPorOrdens = async (start: string, end: string) => {
    try {
      const resp = await api.get<any[]>(`/ordens-venda?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
      const ordens = Array.isArray(resp.data) ? resp.data : [];
      // filtrar apenas finalizadas
      const finalizadas = ordens.filter(o => o.status === 'FINALIZADA' || o.status === 'FINALIZADO');
      const din = finalizadas
        .filter(o => (o.formaPagamento || '').toUpperCase() === 'DINHEIRO')
        .reduce((s, o) => s + Number(o.valorTotal || 0), 0);
      const pix = finalizadas
        .filter(o => (o.formaPagamento || '').toUpperCase() === 'PIX')
        .reduce((s, o) => s + Number(o.valorTotal || 0), 0);

      setTotalDinheiro(din);
      setTotalPix(pix);
      setTotalGeral(din + pix);
    } catch (err) {
      console.error('Erro ao carregar ordens para faturamento:', err);
      setErro('Erro ao calcular faturamento a partir das ordens.');
    }
  };

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
      <h1 className="page-title">Dashboard</h1>

      {erro && <div style={{ color: 'red', marginBottom: 12 }}>{erro}</div>}

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-icon">📦</div>
          <div className="card-content">
            <h3>Produtos</h3>
            <p className="card-value">{qtdProdutos}</p>
            <p className="card-label">Total em Estoque</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Clientes</h3>
            <p className="card-value">{qtdClientes}</p>
            <p className="card-label">Clientes Cadastrados</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">🔧</div>
          <div className="card-content">
            <h3>Serviços</h3>
            <p className="card-value">{qtdServicos}</p>
            <p className="card-label">Serviços Disponíveis</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Faturamento (Mês)</h3>
            <p className="card-value">{formatPrice(totalGeral)}</p>
            <p className="card-label">Dinheiro: {formatPrice(totalDinheiro)} • PIX: {formatPrice(totalPix)}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-welcome">
        <h2>Bem-vindo ao Sistema ERP 🎵</h2>
        <p>Gerencie seus produtos, clientes e serviços de forma eficiente.</p>
        <div style={{ marginTop: 12 }}>
          <button onClick={carregarDashboard}>Atualizar</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
