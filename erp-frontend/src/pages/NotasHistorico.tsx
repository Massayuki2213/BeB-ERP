import { useEffect, useState } from "react";
import api from "../services/api";
import VendaResumoModal from "../components/VendaResumoModal";
import type { Cliente } from "../types";
import { Search, Eye, Trash2 } from "lucide-react";
import "./NotasHistorico.css";

interface Nota {
  id: number;
  clienteId?: number;
  tipo: string;
  dataNota: string;
  valor: number;
  itens: any[];
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
      // 1. Carrega Clientes
      try {
        const respClientes = await api.get("clientes");
        setClientes(respClientes.data || []);
      } catch (e) {
        console.warn("Erro secundário ao carregar clientes.");
      }

      // 2. Carrega Vendas
      const resp = await api.get("ordens-venda");
      const listaVendas = Array.isArray(resp.data) ? resp.data : [];

      // 3. Mapeia e guarda itens
      const notasFormatadas = listaVendas.map((venda: any) => ({
        id: venda.id,
        clienteId: venda.cliente?.id,
        tipo: venda.formaPagamento || "Venda",
        dataNota: venda.dataVenda,
        valor: venda.valorTotal || 0,
        itens: venda.itensVendas || []
      }));

      // --- ORDENAÇÃO DECRESCENTE (Maior ID primeiro) ---
      notasFormatadas.sort((a: Nota, b: Nota) => b.id - a.id);

      setNotas(notasFormatadas);

    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
      alert("Erro ao carregar vendas.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (v: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const formatDateTime = (iso: string) => {
    if(!iso) return "-";
    try {
      return new Date(iso).toLocaleString("pt-BR");
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
    if(!window.confirm("Apagar venda #" + id + "?")) return;
    try {
      await api.delete(`ordens-venda/${id}`);
      setNotas(prev => prev.filter(n => n.id !== id));
    } catch(e) {
      alert("Erro ao apagar venda.");
    }
  };

  const handleSalvarComprovante = async (_html: string) => {
    console.log("Salvando comprovante...");
    return Promise.resolve();
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Histórico de Vendas</h1>
      
      <div className="notas-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Search size={16} color="#9ca3af" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar venda..."
        />
      </div>

      <div className="card notas-card">
        {loading && <p>Carregando...</p>}
        {!loading && notas.length === 0 && <p style={{padding:20}}>Nenhuma venda encontrada.</p>}

        {!loading && notas.length > 0 && (
          <table className="notas-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Tipo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrar().map(nota => (
                <tr key={nota.id}>
                  <td>{nota.id}</td>
                  <td>{getNomeCliente(nota.clienteId)}</td>
                  <td>{formatDateTime(nota.dataNota)}</td>
                  <td>{formatPrice(nota.valor)}</td>
                  <td>{nota.tipo}</td>
                  <td className="acoes">
                     <button title="Ver" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => { setNotaSelecionada(nota); setModalOpen(true); }}><Eye size={16} /></button>
                     <button title="Excluir" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => apagarVenda(nota.id)} className="btn-delete"><Trash2 size={16} /></button>
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
            onSaveComprovante={handleSalvarComprovante}
            venda={{
                id: notaSelecionada.id,
                cliente: clientes.find(c => c.id === notaSelecionada.clienteId),
                dataVenda: notaSelecionada.dataNota,
                valorTotal: notaSelecionada.valor,
                formaPagamento: notaSelecionada.tipo,
                itens: notaSelecionada.itens.map((item: any) => {
                    const preco = item.produto?.precoVenda || 0;
                    const qtd = item.quantidade || 1;
                    return {
                        produtoId: item.produto?.id,
                        nomeProduto: item.produto?.nome || "(Produto Removido)", 
                        quantidade: qtd,
                        precoUnitario: preco,
                        precoTotal: preco * qtd 
                    };
                })
            }}
        />
      )}
    </div>
  );
};

export default NotasHistorico;