import { useState, useEffect } from 'react';
import api from '../services/api';
import type { OrdemServico, Cliente, Veiculo, Produto, Servico, StatusOS } from '../types';
import { Plus, Trash2, X } from 'lucide-react';
import './Pages.css';

const formatPrice = (v?: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const STATUS: StatusOS[] = ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECA', 'FINALIZADA', 'CANCELADA'];

type ItemForm = { produtoId: string; quantidade: string; precoUnitario: string };
type ServicoForm = { servicoId: string; descricao: string; valor: string; parceiro: string; valorRepasse: string };

const OrdensServico = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);

  const [clienteId, setClienteId] = useState<string>('');
  const [veiculoId, setVeiculoId] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [servicosForm, setServicosForm] = useState<ServicoForm[]>([]);

  useEffect(() => {
    fetchOrdens();
    fetchAux();
  }, []);

  const fetchOrdens = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get<OrdemServico[]>('/ordens-servico');
      setOrdens(res.data);
    } catch (err) {
      setError('Erro ao carregar ordens de serviço.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAux = async () => {
    try {
      const [c, v, p, s] = await Promise.all([
        api.get<Cliente[]>('/clientes'),
        api.get<Veiculo[]>('/veiculos'),
        api.get<Produto[]>('/produtos'),
        api.get<Servico[]>('/servicos'),
      ]);
      setClientes(c.data); setVeiculos(v.data); setProdutos(p.data); setServicos(s.data);
    } catch (err) { console.error(err); }
  };

  const veiculosDoCliente = clienteId
    ? veiculos.filter(v => v.cliente?.id === Number(clienteId))
    : veiculos;

  const addItem = () => setItens([...itens, { produtoId: '', quantidade: '1', precoUnitario: '' }]);
  const updItem = (i: number, campo: keyof ItemForm, val: string) =>
    setItens(itens.map((it, idx) => idx === i ? { ...it, [campo]: val } : it));
  const rmItem = (i: number) => setItens(itens.filter((_, idx) => idx !== i));

  const addServico = () => setServicosForm([...servicosForm, { servicoId: '', descricao: '', valor: '', parceiro: '', valorRepasse: '' }]);
  const updServico = (i: number, campo: keyof ServicoForm, val: string) =>
    setServicosForm(servicosForm.map((s, idx) => idx === i ? { ...s, [campo]: val } : s));
  const rmServico = (i: number) => setServicosForm(servicosForm.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setClienteId(''); setVeiculoId(''); setDescricao(''); setItens([]); setServicosForm([]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/ordens-servico', {
        clienteId: Number(clienteId),
        veiculoId: Number(veiculoId),
        descricao,
        itens: itens
          .filter(it => it.produtoId)
          .map(it => ({
            produtoId: Number(it.produtoId),
            quantidade: Number(it.quantidade),
            precoUnitario: it.precoUnitario ? Number(it.precoUnitario) : null,
          })),
        servicos: servicosForm.map(s => ({
          servicoId: s.servicoId ? Number(s.servicoId) : null,
          descricao: s.descricao || null,
          valor: s.valor ? Number(s.valor) : null,
          parceiro: s.parceiro || null,
          valorRepasse: s.valorRepasse ? Number(s.valorRepasse) : null,
        })),
      });
      setShowModal(false);
      resetForm();
      fetchOrdens();
    } catch (err: any) {
      alert(err?.response?.data || 'Erro ao abrir OS.');
    }
  };

  const mudarStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/ordens-servico/${id}/status`, null, { params: { status } });
      fetchOrdens();
    } catch (err: any) {
      alert(err?.response?.data || 'Erro ao alterar status.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Excluir esta OS?')) return;
    try { await api.delete(`/ordens-servico/${id}`); fetchOrdens(); }
    catch { alert('Erro ao excluir OS.'); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Ordens de Serviço</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}><Plus size={16} />Nova OS</button>
      </div>

      {loading && <div className="loading">Carregando ordens...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && ordens.length === 0 && (
        <div className="empty-state"><p>Nenhuma ordem de serviço.</p></div>
      )}

      {!loading && !error && ordens.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>OS</th>
                <th>Cliente</th>
                <th>Veículo</th>
                <th>Peças</th>
                <th>Serviços</th>
                <th>Total</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ordens.map(os => (
                <tr key={os.id}>
                  <td><strong>#{os.id}</strong></td>
                  <td>{os.cliente?.nome || '-'}</td>
                  <td>{os.veiculo?.placa || '-'}</td>
                  <td>{formatPrice(os.valorPecas)}</td>
                  <td>{formatPrice(os.valorServicos)}{os.valorRepasses ? ` (repasse ${formatPrice(os.valorRepasses)})` : ''}</td>
                  <td><strong>{formatPrice(os.valorTotal)}</strong></td>
                  <td>
                    <select value={os.status} onChange={(e) => mudarStatus(os.id, e.target.value)}
                            style={{ padding: '0.3rem', borderRadius: 4 }}>
                      {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className="btn-small btn-delete" title="Excluir" onClick={() => handleDelete(os.id)}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: 720, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>Nova Ordem de Serviço</h2>
            <form onSubmit={handleCreate} className="modal-form">
              <label>Cliente</label>
              <select value={clienteId} required onChange={(e) => { setClienteId(e.target.value); setVeiculoId(''); }}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>

              <label>Veículo</label>
              <select value={veiculoId} required onChange={(e) => setVeiculoId(e.target.value)}>
                <option value="">Selecione...</option>
                {veiculosDoCliente.map(v => <option key={v.id} value={v.id}>{v.placa} {v.modelo ? `- ${v.modelo}` : ''}</option>)}
              </select>

              <label>Descrição / relato</label>
              <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} />

              {/* Peças */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <strong>Peças</strong>
                <button type="button" className="btn-small btn-edit" onClick={addItem}><Plus size={14} />Peça</button>
              </div>
              {itens.map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select value={it.produtoId} onChange={(e) => updItem(i, 'produtoId', e.target.value)} style={{ flex: 2 }}>
                    <option value="">Produto...</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                  <input type="number" step="0.001" placeholder="Qtd" value={it.quantidade}
                         onChange={(e) => updItem(i, 'quantidade', e.target.value)} style={{ width: 70 }} />
                  <input type="number" step="0.01" placeholder="Preço" value={it.precoUnitario}
                         onChange={(e) => updItem(i, 'precoUnitario', e.target.value)} style={{ width: 90 }} />
                  <button type="button" className="btn-small btn-delete" title="Remover" onClick={() => rmItem(i)}><X size={14} /></button>
                </div>
              ))}

              {/* Serviços */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <strong>Serviços / Mão de obra</strong>
                <button type="button" className="btn-small btn-edit" onClick={addServico}><Plus size={14} />Serviço</button>
              </div>
              {servicosForm.map((s, i) => (
                <div key={i} style={{ border: '1px solid #eee', borderRadius: 6, padding: '0.5rem', marginBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select value={s.servicoId} onChange={(e) => updServico(i, 'servicoId', e.target.value)} style={{ flex: 1 }}>
                      <option value="">(livre)</option>
                      {servicos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                    <input type="text" placeholder="Descrição" value={s.descricao}
                           onChange={(e) => updServico(i, 'descricao', e.target.value)} style={{ flex: 2 }} />
                    <input type="number" step="0.01" placeholder="Valor" value={s.valor}
                           onChange={(e) => updServico(i, 'valor', e.target.value)} style={{ width: 90 }} />
                    <button type="button" className="btn-small btn-delete" title="Remover" onClick={() => rmServico(i)}><X size={14} /></button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <input type="text" placeholder="Parceiro (terceirizado)" value={s.parceiro}
                           onChange={(e) => updServico(i, 'parceiro', e.target.value)} style={{ flex: 2 }} />
                    <input type="number" step="0.01" placeholder="Repasse" value={s.valorRepasse}
                           onChange={(e) => updServico(i, 'valorRepasse', e.target.value)} style={{ width: 90 }} />
                  </div>
                </div>
              ))}

              <div className="modal-buttons">
                <button type="submit" className="btn-primary">Abrir OS</button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdensServico;
