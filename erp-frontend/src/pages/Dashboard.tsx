import { useEffect, useState } from 'react';
import api from '../services/api'; 
import { 
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import './Dashboard.css'; // Importando o CSS separado

// Tipagens
type TotaisResponse = { [forma: string]: number };

interface VendaDiaria {
  data: string;
  vendas: number;
  valor: number;
}

interface FormaPagamento {
  nome: string;
  valor: number;
  cor: string;
  [key: string]: any;
}

const Dashboard = () => {
  // --- Estados ---
  const [qtdProdutos, setQtdProdutos] = useState(0);
  const [qtdClientes, setQtdClientes] = useState(0);
  const [qtdServicos, setQtdServicos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
 
  // Financeiros
  const [totalFaturamento, setTotalFaturamento] = useState(0);
  const [totalLucro, setTotalLucro] = useState(0);
 
  // Gráficos
  const [vendasDiarias, setVendasDiarias] = useState<VendaDiaria[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
 
  // Filtros
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes_atual');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const CORES_PAGAMENTO: { [key: string]: string } = {
    DINHEIRO: '#34C759',
    PIX: '#007AFF',
    CARTAO_CREDITO: '#FF9500',
    CARTAO_DEBITO: '#5856D6'
  };

  useEffect(() => {
    carregarDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoSelecionado]);

  // --- Helpers ---
  const formatPrice = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const getDateRange = (periodo: string) => {
    const now = new Date();
    let start = new Date();
    const end = new Date();
   
    switch(periodo) {
      case 'hoje':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'semana_atual':
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      case 'mes_atual':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'ultimos_30':
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
      case 'ultimos_90':
        start.setDate(now.getDate() - 90);
        start.setHours(0, 0, 0, 0);
        break;
      case 'ano_atual':
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        break;
      default:
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
    }
   
    const fmt = (d: Date) => d.toISOString().slice(0, 19);
    return { start: fmt(start), end: fmt(end) };
  };

  // --- Lógica de Carregamento ---
  const carregarDashboard = async () => {
    setLoading(true);
    setErro(null);
    try {
      // 1. Contagens Básicas
      const [prodRes, cliRes, servRes] = await Promise.all([
        api.get('/produtos'),
        api.get('/clientes'),
        api.get('/servicos'),
      ]);
     
      setQtdProdutos(Array.isArray(prodRes.data) ? prodRes.data.length : 0);
      setQtdClientes(Array.isArray(cliRes.data) ? cliRes.data.length : 0);
      setQtdServicos(Array.isArray(servRes.data) ? servRes.data.length : 0);

      // 2. Dados Financeiros
      const { start, end } = getDateRange(periodoSelecionado);
      
      try {
        const totaisResp = await api.get<TotaisResponse>(
          `/dashboard/totais?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
        );
       
        const data = totaisResp.data || {};
        
        const formas: FormaPagamento[] = [
          { nome: 'Dinheiro', valor: Number(data.DINHEIRO || data.dinheiro || 0), cor: CORES_PAGAMENTO.DINHEIRO },
          { nome: 'PIX', valor: Number(data.PIX || data.pix || 0), cor: CORES_PAGAMENTO.PIX },
          { nome: 'Crédito', valor: Number(data.CARTAO_CREDITO || data.credito || 0), cor: CORES_PAGAMENTO.CARTAO_CREDITO },
          { nome: 'Débito', valor: Number(data.CARTAO_DEBITO || data.debito || 0), cor: CORES_PAGAMENTO.CARTAO_DEBITO },
        ];
       
        setFormasPagamento(formas);
        const totalFat = formas.reduce((acc, f) => acc + f.valor, 0);
        setTotalFaturamento(totalFat);
        
      } catch (err) {
        console.warn('Endpoint /dashboard/totais indisponível, fallback para ordens...');
        await carregarDadosFinanceirosPorOrdens(start, end);
      }

      await carregarGraficoLinha(start, end);

    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setErro("Não foi possível carregar os dados. Verifique a conexão.");
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosFinanceirosPorOrdens = async (start: string, end: string) => {
    try {
      const resp = await api.get<any[]>(
        `/ordens-venda?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      );
     
      const ordens = Array.isArray(resp.data) ? resp.data : [];
      const finalizadas = ordens.filter(o =>
        o.status === 'FINALIZADA' || o.status === 'FINALIZADO'
      );

      const totaisPorForma: { [key: string]: number } = {};
      let totalCusto = 0;

      finalizadas.forEach(o => {
        const formaRaw = o.formaPagamento || 'DINHEIRO';
        const forma = formaRaw.toUpperCase().replace('Ç', 'C').replace('Ã', 'A'); 
        
        const valor = Number(o.valorTotal || 0);
        
        let chave = 'DINHEIRO';
        if (forma.includes('PIX')) chave = 'PIX';
        else if (forma.includes('CREDITO')) chave = 'CARTAO_CREDITO';
        else if (forma.includes('DEBITO')) chave = 'CARTAO_DEBITO';

        totaisPorForma[chave] = (totaisPorForma[chave] || 0) + valor;
       
        if (o.itensVendas && Array.isArray(o.itensVendas)) {
          o.itensVendas.forEach((item: any) => {
            const custo = item.precoCusto || (item.precoUnitario * 0.4);
            totalCusto += custo * item.quantidade;
          });
        }
      });

      const formas: FormaPagamento[] = [
        { nome: 'Dinheiro', valor: totaisPorForma.DINHEIRO || 0, cor: CORES_PAGAMENTO.DINHEIRO },
        { nome: 'PIX', valor: totaisPorForma.PIX || 0, cor: CORES_PAGAMENTO.PIX },
        { nome: 'Crédito', valor: totaisPorForma.CARTAO_CREDITO || 0, cor: CORES_PAGAMENTO.CARTAO_CREDITO },
        { nome: 'Débito', valor: totaisPorForma.CARTAO_DEBITO || 0, cor: CORES_PAGAMENTO.CARTAO_DEBITO },
      ];

      setFormasPagamento(formas);
      const totalFat = formas.reduce((acc, f) => acc + f.valor, 0);
      setTotalFaturamento(totalFat);
      setTotalLucro(totalFat - totalCusto);

    } catch (err) {
      console.error('Erro no fallback:', err);
    }
  };

  const carregarGraficoLinha = async (start: string, end: string) => {
    try {
      const resp = await api.get<any[]>(
        `/ordens-venda?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      );
     
      const ordens = Array.isArray(resp.data) ? resp.data : [];
      const finalizadas = ordens.filter(o =>
        o.status === 'FINALIZADA' || o.status === 'FINALIZADO'
      );

      const vendasPorDia: { [key: string]: { vendas: number; valor: number } } = {};
     
      finalizadas.forEach(o => {
        const dataRaw = o.dataVenda || o.dataCriacao;
        if (!dataRaw) return;

        const dataObj = new Date(dataRaw);
        const dataStr = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
       
        if (!vendasPorDia[dataStr]) {
          vendasPorDia[dataStr] = { vendas: 0, valor: 0 };
        }
       
        vendasPorDia[dataStr].vendas += 1;
        vendasPorDia[dataStr].valor += Number(o.valorTotal || 0);
      });

      const vendas = Object.keys(vendasPorDia).map(key => ({
        data: key,
        vendas: vendasPorDia[key].vendas,
        valor: vendasPorDia[key].valor
      }));
      
      vendas.sort((a, b) => {
        const [da, ma] = a.data.split('/').map(Number);
        const [db, mb] = b.data.split('/').map(Number);
        return (ma - mb) || (da - db);
      });

      setVendasDiarias(vendas);

    } catch (err) {
      console.error('Erro ao carregar gráfico:', err);
    }
  };

  const aplicarFiltroPersonalizado = () => {
    if (!dataInicio || !dataFim) {
      alert('Selecione as datas de início e fim');
      return;
    }
   
    const start = new Date(dataInicio + 'T00:00:00').toISOString().slice(0, 19);
    const end = new Date(dataFim + 'T23:59:59').toISOString().slice(0, 19);
   
    carregarDadosFinanceirosPorOrdens(start, end);
    carregarGraficoLinha(start, end);
  };

  // --- Renderização ---
  if (loading && !totalFaturamento) {
    return (
      <div className="loading-container">
        <h3>Carregando Dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        {erro && <div className="error-message">{erro}</div>}
      </div>

      {/* Filtros */}
      <div className="filters-container">
        <div className="filters-wrapper">
          
          <div className="filter-group">
            <label className="filter-label">Período</label>
            <select
              className="filter-select"
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(e.target.value)}
            >
              <option value="hoje">Hoje</option>
              <option value="semana_atual">Esta Semana</option>
              <option value="mes_atual">Este Mês</option>
              <option value="ultimos_30">Últimos 30 Dias</option>
              <option value="ano_atual">Este Ano</option>
            </select>
          </div>

          <div className="filter-group" style={{ flex: 0.8 }}>
            <label className="filter-label">De</label>
            <input 
              type="date" 
              className="filter-input"
              value={dataInicio} 
              onChange={(e) => setDataInicio(e.target.value)} 
            />
          </div>

          <div className="filter-group" style={{ flex: 0.8 }}>
            <label className="filter-label">Até</label>
            <input 
              type="date" 
              className="filter-input"
              value={dataFim} 
              onChange={(e) => setDataFim(e.target.value)} 
            />
          </div>

          <button onClick={aplicarFiltroPersonalizado} className="btn-filter">
            Filtrar
          </button>

        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card green-gradient">
          <div className="kpi-icon">💰</div>
          <div>
            <h3 className="kpi-title">Faturamento</h3>
            <p className="kpi-value">{formatPrice(totalFaturamento)}</p>
          </div>
        </div>

        <div className="kpi-card blue-gradient">
          <div className="kpi-icon">📈</div>
          <div>
            <h3 className="kpi-title">Lucro Estimado</h3>
            <p className="kpi-value">{formatPrice(totalLucro)}</p>
          </div>
        </div>

        <div className="kpi-card white">
          <div className="kpi-icon">📦</div>
          <div>
            <h3 className="kpi-title">Produtos</h3>
            <p className="kpi-value">{qtdProdutos}</p>
          </div>
        </div>

        <div className="kpi-card white">
          <div className="kpi-icon">👥</div>
          <div>
            <h3 className="kpi-title">Clientes</h3>
            <p className="kpi-value">{qtdClientes}</p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Vendas no Período</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={vendasDiarias}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f7" />
              <XAxis dataKey="data" stroke="#86868b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#86868b" style={{ fontSize: '12px' }} />
              <Tooltip formatter={(value: number) => formatPrice(value)} />
              <Line type="monotone" dataKey="valor" stroke="#007AFF" strokeWidth={3} dot={{ fill: '#007AFF', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Meios de Pagamento</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={formasPagamento.filter(f => f.valor > 0)}
                dataKey="valor"
                nameKey="nome"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {formasPagamento.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatPrice(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;