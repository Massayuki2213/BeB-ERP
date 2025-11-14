// src/components/VendaResumoModal.tsx
import React from 'react';
import './VendaResumoModal.css';
import type { Cliente, ItemVenda } from '../types';

// NOVAS IMPORTAÇÕES PARA GERAR PDF
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  onSaveComprovante?: (htmlContent: string) => Promise<void>; // Prop mantida
};

const formatPrice = (v?: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
};

const VendaResumoModal: React.FC<Props> = ({ open, venda, onClose }) => {
  if (!open || !venda) return null;

  // Esta função está 100% correta, não mudei nada
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

  // --- FUNÇÃO MODIFICADA/ADICIONADA ---
  // A antiga 'handleSalvar' foi substituída por esta
  const handleSalvarPDF = () => {
    // 1. Gera o HTML
    const html = gerarHtmlComprovante();

    // 2. Cria um container temporário para "desenhar" o HTML
    const container = document.createElement('div');
    container.style.width = '210mm'; // Largura A4
    container.style.padding = '10mm'; // Margens internas
    container.style.boxSizing = 'border-box';
    container.style.position = 'absolute';
    container.style.left = '-300mm'; // Joga pra fora da tela
    container.innerHTML = html;
    document.body.appendChild(container);

    // 3. Usa html2canvas para "tirar uma foto" do container
    html2canvas(container, {
      scale: 2, // Aumenta a resolução
      useCORS: true,
    }).then(canvas => {
      // 4. Configura o PDF (A4)
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // Retrato, milímetros, A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10; // Margem de 10mm
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = contentHeight;
      let position = 0;

      // 5. Adiciona a imagem ao PDF (com margens)
      pdf.addImage(imgData, 'PNG', margin, position + margin, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - (margin * 2)); // Subtrai a altura útil

      // 6. Lógica para múltiplas páginas (se o comprovante for gigante)
      while (heightLeft > 0) {
        position = heightLeft - contentHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position + margin, contentWidth, contentHeight);
        heightLeft -= (pdfHeight - (margin * 2));
      }
      
      // 7. Salva o arquivo PDF
      pdf.save(`comprovante-venda.pdf`);

      // 8. Limpa o container temporário
      document.body.removeChild(container);
    }).catch(err => {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao gerar PDF.");
      // Garante a limpeza mesmo se der erro
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    });
  };

  return (
    <div className="vr-modal-backdrop">
      <div className="vr-modal">
        <header className="vr-modal-header">
          <h3>Comprovante de Venda</h3>
          <button className="vr-close" onClick={onClose}>✕</button>
        </header>

        <section className="vr-body">
          {/* ... (Toda a sua seção <vr-meta> e <table> ... */}
          {/* Copie e cole seu código aqui para garantir */}

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
          
          
          {/* --- BOTÃO MODIFICADO --- */}
          <button onClick={handleSalvarPDF}>Baixar PDF</button>
          
          <button onClick={onClose}>Fechar</button>
        </footer>
      </div>
    </div>
  );
};

export default VendaResumoModal;