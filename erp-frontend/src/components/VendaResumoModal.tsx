// src/components/VendaResumoModal.tsx
import React from 'react';
import './VendaResumoModal.css';
import type { Cliente, ItemVenda } from '../types';

export type VendaResumo = {
  id?: number;
  cliente?: Cliente | null;
  dataVenda: string; // ISO
  itens: ItemVenda[];
  valorTotal: number;
  formaPagamento?: string;
};

type Props = {
  open: boolean;
  venda?: VendaResumo | null;
  onClose: () => void;
  onSaveComprovante?: (htmlContent: string) => Promise<void>;
};

const formatPrice = (v?: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
};

const VendaResumoModal: React.FC<Props> = ({ open, venda, onClose, onSaveComprovante }) => {
  if (!open || !venda) return null;

  const gerarHtmlComprovante = () => {
    const clienteHtml = venda.cliente ? `
      <div><strong>Cliente:</strong> ${venda.cliente.nome} ${venda.cliente.email ? `• ${venda.cliente.email}` : ''} ${venda.cliente.telefone ? `• ${venda.cliente.telefone}` : ''}</div>
    ` : `<div><strong>Cliente:</strong> —</div>`;

    const linhas = venda.itens.map(i => `
      <tr>
        <td style="padding:6px 8px;text-align:center;">${i.quantidade}</td>
        <td style="padding:6px 8px;">${i.nomeProduto}</td>
        <td style="padding:6px 8px;text-align:right;">${formatPrice(i.precoUnitario)}</td>
        <td style="padding:6px 8px;text-align:right;">${formatPrice(i.precoTotal)}</td>
      </tr>
    `).join('');

    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Comprovante Venda ${venda.id ?? ''}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; color: #222; padding: 18px; }
          h2 { margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border-bottom: 1px solid #eee; }
          th { text-align:left; padding: 8px; background:#f8f8f8; }
          tfoot td { padding: 8px; font-weight: 700; border-top: 2px solid #ddd; }
        </style>
      </head>
      <body>
        <h2>Comprovante de Venda ${venda.id ? '#'+venda.id : ''}</h2>
        ${clienteHtml}
        <div><strong>Data:</strong> ${formatDateTime(venda.dataVenda)}</div>
        <div><strong>Forma Pagamento:</strong> ${venda.formaPagamento ?? '—'}</div>

        <table>
          <thead>
            <tr>
              <th style="width:10%;">Qtd</th>
              <th>Produto</th>
              <th style="width:18%;text-align:right;">Valor unit.</th>
              <th style="width:18%;text-align:right;">Valor total</th>
            </tr>
          </thead>
          <tbody>
            ${linhas}
          </tbody>
          <tfoot>
            <tr>
              <td></td>
              <td style="text-align:right">TOTAL</td>
              <td></td>
              <td style="text-align:right">${formatPrice(venda.valorTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;
  };

  const handleImprimir = () => {
    const html = gerarHtmlComprovante();
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) {
      alert('Não foi possível abrir janela de impressão. Verifique bloqueadores.');
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const handleSalvar = async () => {
    if (!onSaveComprovante) {
      alert('Funcionalidade de salvar não configurada.');
      return;
    }
    const html = gerarHtmlComprovante();
    try {
      await onSaveComprovante(html);
      alert('Comprovante salvo com sucesso.');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar comprovante. Veja console.');
    }
  };

  return (
    <div className="vr-modal-backdrop">
      <div className="vr-modal">
        <header className="vr-modal-header">
          <h3>Comprovante de Venda {venda.id ? `#${venda.id}` : ''}</h3>
          <button className="vr-close" onClick={onClose}>✕</button>
        </header>

        <section className="vr-body">
          <div className="vr-meta">
            <div><strong>Cliente:</strong> {venda.cliente?.nome ?? '—'}</div>
            {venda.cliente?.email && <div><strong>Email:</strong> {venda.cliente.email}</div>}
            {venda.cliente?.telefone && <div><strong>Telefone:</strong> {venda.cliente.telefone}</div>}
            <div><strong>Data:</strong> {formatDateTime(venda.dataVenda)}</div>
            <div><strong>Forma Pagamento:</strong> {venda.formaPagamento ?? '—'}</div>
          </div>

          <table className="vr-table">
            <thead>
              <tr>
                <th>Qtd</th>
                <th>Produto</th>
                <th style={{ textAlign: 'right' }}>Valor unit.</th>
                <th style={{ textAlign: 'right' }}>Valor total</th>
              </tr>
            </thead>
            <tbody>
              {venda.itens.map((i, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'center' }}>{i.quantidade}</td>
                  <td>{i.nomeProduto}</td>
                  <td style={{ textAlign: 'right' }}>{formatPrice(i.precoUnitario)}</td>
                  <td style={{ textAlign: 'right' }}>{formatPrice(i.precoTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>TOTAL</td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatPrice(venda.valorTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <footer className="vr-footer">
          <button onClick={handleImprimir}>Imprimir</button>
          <button onClick={handleSalvar}>Salvar comprovante</button>
          <button onClick={onClose}>Fechar</button>
        </footer>
      </div>
    </div>
  );
};

export default VendaResumoModal;
