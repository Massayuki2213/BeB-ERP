import { useEffect, useState } from "react";
import api from "../services/api";
import VendaResumoModal from "../components/VendaResumoModal";
import type { Cliente } from "../types";
import "./NotasHistorico.css"; 

// --- IMPORTANTE: MESMA CONSTANTE DO PDV ---
const ID_MAO_DE_OBRA = 4; 

interface Nota {
  id: number;
  clienteId?: number;
  tipo: string;
  dataNota: string;
  valor: number;
  itens: any[];
  descricao?: string; 
}

const NotasHistorico = () => {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");
  const [notaSelecionada, setNotaSelecionada] = useState<Nota | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      try {
        const respClientes = await api.get("clientes");
        setClientes(respClientes.data || []);
      } catch (e) {
        console.warn("Erro secundário clientes");
      }

      const resp = await api.get("ordens-venda");
      const listaVendas = Array.isArray(resp.data) ? resp.data : [];

      const notasFormatadas = listaVendas.map((venda: any) => ({
        id: venda.id,
        clienteId: venda.cliente?.id,
        tipo: venda.formaPagamento || "Venda",
        dataNota: venda.dataVenda,
        valor: venda.valorTotal || 0,
        descricao: venda.descricao || '', 
        itens: venda.itensVendas || []
      }));

      notasFormatadas.sort((a: Nota, b: Nota) => b.id - a.id);
      setNotas(notasFormatadas);

    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (v: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const formatDateTime = (iso: string) => {
    if(!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleString("pt-BR", { 
        day: '2-digit', month: '2-digit', year: '2-digit', 
        hour: '2-digit', minute: '2-digit' 
      });
    } catch { return iso; }
  };

  const getNomeCliente = (id?: number) => {
    if (!id) return "Consumidor Final";
    const c = clientes.find(cl => cl.id === id);
    return c ? c.nome : "Consumidor Final";
  };

  const filtrar = () => {
    if (!busca) return notas;
    const t = busca.toLowerCase();
    return notas.filter(n => 
      n.id.toString().includes(t) ||
      getNomeCliente(n.clienteId).toLowerCase().includes(t) ||
      (n.tipo || "").toLowerCase().includes(t)
    );
  };

  const apagarVenda = async (id: number) => {
    if(!window.confirm("Tem certeza que deseja apagar o registro da venda #" + id + "?")) return;
    try {
      await api.delete(`ordens-venda/${id}`);
      setNotas(prev => prev.filter(n => n.id !== id));
    } catch(e) {
      alert("Erro ao apagar venda.");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Histórico de Vendas</h1>
          <p style={{color: '#666', marginTop: '4px', fontSize: '0.9rem'}}>
            Consulte e gerencie todas as vendas realizadas.
          </p>
        </div>
      </div>
      
      <div className="search-card">
        <input 
          className="search-input"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="🔍 Buscar por cliente, ID ou tipo..."
        />
      </div>

      <div className="table-card">
        {loading && <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>Carregando histórico...</div>}
        
        {!loading && notas.length === 0 && (
          <div style={{padding: '40px', textAlign: 'center', color: '#888'}}>
            Nenhuma venda encontrada.
          </div>
        )}

        {!loading && notas.length > 0 && (
          <table className="historico-table">
            <thead>
              <tr>
                <th style={{width: '80px'}}>ID</th>
                <th>Cliente</th>
                <th>Data / Hora</th>
                <th>Forma Pagto</th>
                <th>Valor Total</th>
                <th style={{width: '100px'}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrar().map(nota => (
                <tr key={nota.id}>
                  <td className="col-id">#{nota.id}</td>
                  <td style={{fontWeight: 500}}>{getNomeCliente(nota.clienteId)}</td>
                  <td style={{color: '#555'}}>{formatDateTime(nota.dataNota)}</td>
                  <td>
                    <span className="badge-tipo">{nota.tipo.toLowerCase()}</span>
                  </td>
                  <td className="col-valor">{formatPrice(nota.valor)}</td>
                  <td>
                      <div className="actions-cell">
                        <button 
                          className="btn-icon btn-view" 
                          onClick={() => { setNotaSelecionada(nota); setModalOpen(true); }}
                          title="Ver Detalhes"
                        >
                          👁️
                        </button>
                        <button 
                          className="btn-icon btn-delete" 
                          onClick={() => apagarVenda(nota.id)}
                          title="Excluir Registro"
                        >
                          🗑️
                        </button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {notaSelecionada && (
        <VendaResumoModal
            open={modalOpen}
            onClose={() => { setModalOpen(false); setNotaSelecionada(null); }}
            venda={{
                id: notaSelecionada.id,
                cliente: clientes.find(c => c.id === notaSelecionada.clienteId),
                dataVenda: notaSelecionada.dataNota,
                valorTotal: notaSelecionada.valor,
                formaPagamento: notaSelecionada.tipo,
                descricao: notaSelecionada.descricao,
                // --- MAPEMANETO CORRIGIDO COM DETECÇÃO DE SERVIÇO ---
                itens: notaSelecionada.itens.map((item: any) => {
                    const precoUnitario = item.precoUnitario || item.produto?.precoVenda || 0; 
                    const nomeProduto = item.nomeItem || item.produto?.nome || "(Produto Removido)"; 
                    const qtd = item.quantidade || 1;
                    const precoTotal = item.precoTotal || (precoUnitario * qtd);
                    
                    // Identifica ID do produto (pode vir direto ou dentro de produto)
                    const pid = item.produtoId || item.produto?.id;

                    // LÓGICA DE DETECÇÃO (IGUAL AO PDV)
                    // 1. É o ID 4? (Mão de Obra)
                    const isIdServico = pid === ID_MAO_DE_OBRA;
                    // 2. O nome parece serviço? (Fallback)
                    const nomeLower = nomeProduto.toLowerCase();
                    const isNomeServico = nomeLower.includes('serviço') || nomeLower.includes('mão de obra') || nomeLower.includes('instalação');

                    const ehServico = isIdServico || isNomeServico;

                    return {
                        produtoId: pid,
                        nomeProduto: nomeProduto, 
                        quantidade: qtd,
                        precoUnitario: precoUnitario,
                        precoTotal: precoTotal,
                        // Aqui passamos a flag correta para o Modal separar as tabelas
                        isService: ehServico,
                        tipo: ehServico ? 'SERVICO' : 'PRODUTO'
                    };
                })
            }}
        />
      )}
    </div>
  );
};

export default NotasHistorico;