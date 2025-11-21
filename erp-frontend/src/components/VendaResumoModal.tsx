// src/components/VendaResumoModal.tsx
import React from 'react';
import './VendaResumoModal.css';
import type { ItemVenda } from '../types';

// Importações do PDF
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type VendaResumo = {
  id?: number;
  cliente?: { nome: string; email?: string; telefone?: string } | null;
  dataVenda: string;
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

const VendaResumoModal: React.FC<Props> = ({ open, venda, onClose }) => {
  if (!open || !venda) return null;

  // --- 1. LÓGICA DE SEPARAÇÃO ---
  // Verifica se é serviço pela flag isService (front) ou pelo tipo (back)
  const isServico = (item: any) => item.isService === true || item.tipo === 'SERVICO';
  
  const listaProdutos = venda.itens.filter(i => !isServico(i));
  const listaServicos = venda.itens.filter(i => isServico(i));

  // --- 2. HTML PARA O PDF ---
  const gerarHtmlComprovante = () => {
    const clienteHtml = venda.cliente ? `
      <div><strong>Cliente:</strong> ${venda.cliente.nome} ${venda.cliente.email ? `• ${venda.cliente.email}` : ''} ${venda.cliente.telefone ? `• ${venda.cliente.telefone}` : ''}</div>
    ` : `<div><strong>Cliente:</strong> —</div>`;

    // Gera linhas de Produtos
    const linhasProdutos = listaProdutos.map(i => `
      <tr>
        <td style="padding:6px 8px;text-align:center;">${i.quantidade}</td>
        <td style="padding:6px 8px;">${i.nomeProduto}</td>
        <td style="padding:6px 8px;text-align:right;">${formatPrice(i.precoUnitario)}</td>
        <td style="padding:6px 8px;text-align:right;">${formatPrice(i.precoTotal)}</td>
      </tr>
    `).join('');

    // Gera linhas de Serviços (com cabeçalho se existir)
    let linhasServicos = '';
    if (listaServicos.length > 0) {
      linhasServicos = `
        <tr>
          <td colspan="4" style="background-color: #f0f0f0; font-weight: bold; padding: 8px; font-size: 0.9em; border-bottom: 1px solid #ddd;">
            SERVIÇOS / MÃO DE OBRA
          </td>
        </tr>
        ${listaServicos.map(i => `
          <tr>
            <td style="padding:6px 8px;text-align:center;">-</td>
            <td style="padding:6px 8px;">${i.nomeProduto}</td>
            <td style="padding:6px 8px;text-align:right;">${formatPrice(i.precoUnitario)}</td>
            <td style="padding:6px 8px;text-align:right;">${formatPrice(i.precoTotal)}</td>
          </tr>
        `).join('')}
      `;
    }

    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Comprovante Venda</title>
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
        <h2>Comprovante de Venda </h2>
        ${clienteHtml}
        <div><strong>Data:</strong> ${formatDateTime(venda.dataVenda)}</div>
        <div><strong>Forma Pagamento:</strong> ${venda.formaPagamento ?? '—'}</div>
        <table>
          <thead>
            <tr>
              <th style="width:10%;">Qtd</th>
              <th>Descrição</th>
              <th style="width:18%;text-align:right;">Valor unit.</th>
              <th style="width:18%;text-align:right;">Valor total</th>
            </tr>
          </thead>
          <tbody>
            ${linhasProdutos}
            ${linhasServicos}
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

  const handleSalvarPDF = () => {
    const html = gerarHtmlComprovante();
    const container = document.createElement('div');
    container.style.width = '210mm';
    container.style.padding = '10mm';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.background = 'white'; // Importante para o html2canvas
    container.innerHTML = html;
    document.body.appendChild(container);

    html2canvas(container, { scale: 2, useCORS: true }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = contentHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', margin, position + margin, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - (margin * 2));

      while (heightLeft > 0) {
        position = heightLeft - contentHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position + margin, contentWidth, contentHeight);
        heightLeft -= (pdfHeight - (margin * 2));
      }
      
      pdf.save(`comprovante.pdf`);
      document.body.removeChild(container);
    }).catch(err => {
      console.error(err);
      if (document.body.contains(container)) document.body.removeChild(container);
    });
  };

  return (
    <div className="vr-modal-backdrop">
      <div className="vr-modal">
        <header className="vr-modal-header">
          <h3>Comprovante de Venda </h3>
          <button className="vr-close" onClick={onClose}>✕</button>
        </header>

        <section className="vr-body">
          <div className="vr-meta">
            <div><strong>Cliente:</strong> {venda.cliente?.nome ?? '—'}</div>
            {venda.cliente?.email && <div><strong>Email:</strong> {venda.cliente.email}</div>}
            <div><strong>Data:</strong> {formatDateTime(venda.dataVenda)}</div>
            <div><strong>Pagamento:</strong> {venda.formaPagamento ?? '—'}</div>
          </div>

          {/* --- 3. JSX VISUAL (TABELA NA TELA) --- */}
          <table className="vr-table">
            <thead>
              <tr>
                <th>Qtd</th>
                <th>Descrição</th>
                <th style={{ textAlign: 'right' }}>Unit.</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Renderiza Produtos */}
              {listaProdutos.map((i, idx) => (
                <tr key={`prod-${idx}`}>
                  <td style={{ textAlign: 'center' }}>{i.quantidade}</td>
                  <td>{i.nomeProduto}</td>
                  <td style={{ textAlign: 'right' }}>{formatPrice(i.precoUnitario)}</td>
                  <td style={{ textAlign: 'right' }}>{formatPrice(i.precoTotal)}</td>
                </tr>
              ))}

              {/* Renderiza Serviços (Se houver) */}
              {listaServicos.length > 0 && (
                <>
                  <tr>
                    <td colSpan={4} style={{ 
                      backgroundColor: '#f5f5f5', 
                      fontWeight: 'bold', 
                      paddingTop: '15px',
                      borderBottom: '1px solid #ddd',
                      color: '#555'
                    }}>
                      SERVIÇOS
                    </td>
                  </tr>
                  {listaServicos.map((i, idx) => (
                    <tr key={`serv-${idx}`}>
                      <td style={{ textAlign: 'center' }}>-</td>
                      <td>{i.nomeProduto}</td>
                      <td style={{ textAlign: 'right' }}>{formatPrice(i.precoUnitario)}</td>
                      <td style={{ textAlign: 'right' }}>{formatPrice(i.precoTotal)}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}></td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>TOTAL</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatPrice(venda.valorTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <footer className="vr-footer">
          <button onClick={handleSalvarPDF} className="btn-pdf">Baixar PDF</button>
          <button onClick={onClose} className="btn-close">Fechar</button>
        </footer>
      </div>
    </div>
  );
};

export default VendaResumoModal;