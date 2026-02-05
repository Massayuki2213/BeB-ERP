import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
  DollarSign, 
  Plus, 
  Minus, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import './Pages.css';

// Interface baseada na sua Entidade Java
interface Lancamento {
  id: number;
  descricao: string;
  valor: number;
  tipo: 'RECEITA' | 'DESPESA';
  dataHora: string;
}

const Financeiro = () => {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // ESTADO DA DATA SELECIONADA (Inicia Hoje no formato YYYY-MM-DD)
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [novoLancamento, setNovoLancamento] = useState({
    descricao: '',
    valor: '',
    tipo: 'DESPESA'
  });

  // Recarrega sempre que a data mudar
  useEffect(() => {
    carregarFinanceiro();
  }, [dataSelecionada]);

  const carregarFinanceiro = async () => {
    setLoading(true);
    try {
      // Passamos a data como parametro na URL para o Java filtrar
      const response = await api.get<Lancamento[]>(`/lancamentos-caixa?data=${dataSelecionada}`);
      setLancamentos(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const valorNumber = Number(novoLancamento.valor);
        if(!valorNumber || valorNumber <= 0) {
            alert("Valor inválido");
            return;
        }

        // O lançamento manual assume a data e hora atuais
        await api.post('/lancamentos-caixa', {
            descricao: novoLancamento.descricao,
            valor: valorNumber,
            tipo: novoLancamento.tipo,
            dataHora: new Date().toISOString()
        });
        
        setShowModal(false);
        setNovoLancamento({ descricao: '', valor: '', tipo: 'DESPESA' });
        carregarFinanceiro();
    } catch (err) {
        alert("Erro ao salvar lançamento");
    }
  };

  // --- FUNÇÃO DE DATA CORRIGIDA (Evita bug de fuso horário) ---
  const mudarDia = (dias: number) => {
      // Adiciona meio-dia para garantir que o fuso -3h não volte o dia
      const data = new Date(dataSelecionada + 'T12:00:00'); 
      data.setDate(data.getDate() + dias);
      setDataSelecionada(data.toISOString().split('T')[0]);
  };

  // --- CÁLCULOS (Resumo do Dia) ---
  const resumo = useMemo(() => {
    return lancamentos.reduce((acc, item) => {
        if (item.tipo === 'RECEITA') {
            acc.entradas += item.valor;
            acc.saldo += item.valor;
        } else {
            acc.saidas += item.valor;
            acc.saldo -= item.valor;
        }
        return acc;
    }, { entradas: 0, saidas: 0, saldo: 0 });
  }, [lancamentos]);

  const formatPrice = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  
  // Formata apenas a hora, já que estamos vendo o dia específico
  const formatTime = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // Formata a data para o título (Ex: 29/01/2026)
  const dataFormatadaTitulo = new Date(dataSelecionada + 'T12:00:00').toLocaleDateString('pt-BR');

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <h1>Caixa Diário</h1>
          <p>Movimentações de {dataFormatadaTitulo}</p>
        </div>
        
        {/* BARRA DE CONTROLE DE DATA */}
        <div className="date-control-bar" style={{display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
            <button onClick={() => mudarDia(-1)} className="btn-icon" title="Dia Anterior"><ChevronLeft size={20}/></button>
            
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <CalendarIcon size={18} color="#64748b" />
                <input 
                    type="date" 
                    value={dataSelecionada} 
                    onChange={(e) => setDataSelecionada(e.target.value)}
                    style={{border: 'none', fontWeight: 600, color: '#334155', fontSize: '1rem', outline: 'none', background: 'transparent'}}
                />
            </div>

            <button onClick={() => mudarDia(1)} className="btn-icon" title="Próximo Dia"><ChevronRight size={20}/></button>
        </div>

        <div style={{display: 'flex', gap: '10px'}}>
            <button className="btn-primary" style={{backgroundColor: '#ef4444'}} onClick={() => { setNovoLancamento({...novoLancamento, tipo: 'DESPESA'}); setShowModal(true); }}>
                <Minus size={18} style={{marginRight: 8}} /> Pagar Conta
            </button>
            <button className="btn-primary" onClick={() => { setNovoLancamento({...novoLancamento, tipo: 'RECEITA'}); setShowModal(true); }}>
                <Plus size={18} style={{marginRight: 8}} /> Entrada Manual
            </button>
        </div>
      </div>

      {/* CARDS DE RESUMO DO DIA */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px'}}>
         <div style={{background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: '5px solid #10b981'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                <span style={{color: '#64748b', fontWeight: 600}}>Entradas do Dia</span>
                <ArrowUpCircle color="#10b981" />
            </div>
            <div style={{fontSize: '1.8rem', fontWeight: 700, color: '#10b981'}}>{formatPrice(resumo.entradas)}</div>
         </div>

         <div style={{background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: '5px solid #ef4444'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                <span style={{color: '#64748b', fontWeight: 600}}>Saídas do Dia</span>
                <ArrowDownCircle color="#ef4444" />
            </div>
            <div style={{fontSize: '1.8rem', fontWeight: 700, color: '#ef4444'}}>{formatPrice(resumo.saidas)}</div>
         </div>

         <div style={{background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: `5px solid ${resumo.saldo >= 0 ? '#2563eb' : '#ef4444'}`}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                <span style={{color: '#64748b', fontWeight: 600}}>Saldo do Dia</span>
                <DollarSign color={resumo.saldo >= 0 ? '#2563eb' : '#ef4444'} />
            </div>
            <div style={{fontSize: '1.8rem', fontWeight: 700, color: resumo.saldo >= 0 ? '#2563eb' : '#ef4444'}}>
                {formatPrice(resumo.saldo)}
            </div>
         </div>
      </div>

      {/* TABELA DE LANÇAMENTOS */}
      <div className="table-wrapper">
        {loading ? <div className="loading-state">Calculando dia {dataFormatadaTitulo}...</div> : (
            <table className="data-table">
                <thead>
                    <tr>
                        <th style={{width: '100px'}}>Hora</th>
                        <th>Descrição</th>
                        <th style={{width: '100px'}}>Tipo</th>
                        <th style={{textAlign: 'right'}}>Valor</th>
                    </tr>
                </thead>
                {/* --- AQUI ESTÁ A CORREÇÃO VISUAL DA TABELA --- */}
                <tbody>
                    {lancamentos.length === 0 ? (
                        <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}>
                                    <Search size={32} opacity={0.2} />
                                    <span>Nenhuma movimentação registrada neste dia.</span>
                                </div>
                            </td>
                        </tr>
                    ) : lancamentos.map(item => (
                        <tr key={item.id}>
                            <td style={{color: '#64748b', fontSize: '0.9rem', fontWeight: 500}}>{formatTime(item.dataHora)}</td>
                            <td style={{fontWeight: 500}}>{item.descricao}</td>
                            <td>
                                <span style={{
                                    padding: '4px 8px', 
                                    borderRadius: '6px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    background: item.tipo === 'RECEITA' ? '#ecfdf5' : '#fef2f2',
                                    color: item.tipo === 'RECEITA' ? '#059669' : '#dc2626'
                                }}>
                                    {item.tipo}
                                </span>
                            </td>
                            <td style={{
                                fontWeight: 700, 
                                textAlign: 'right',
                                color: item.tipo === 'RECEITA' ? '#059669' : '#dc2626'
                            }}>
                                {item.tipo === 'DESPESA' ? '- ' : '+ '}
                                {formatPrice(item.valor)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>

      {/* MODAL DE LANÇAMENTO MANUAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{novoLancamento.tipo === 'RECEITA' ? 'Lançar Receita' : 'Lançar Despesa'}</h2>
                </div>
                <form onSubmit={handleSalvar} className="form-grid">
                    <div className="form-group full-width">
                        <label>Descrição</label>
                        <input required value={novoLancamento.descricao} onChange={e => setNovoLancamento({...novoLancamento, descricao: e.target.value})} />
                    </div>
                    <div className="form-group full-width">
                        <label>Valor (R$)</label>
                        <input type="number" step="0.01" required value={novoLancamento.valor} onChange={e => setNovoLancamento({...novoLancamento, valor: e.target.value})} />
                    </div>
                    <div className="modal-footer full-width">
                        <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary" style={{backgroundColor: novoLancamento.tipo === 'DESPESA' ? '#ef4444' : '#2563eb'}}>Confirmar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Financeiro;