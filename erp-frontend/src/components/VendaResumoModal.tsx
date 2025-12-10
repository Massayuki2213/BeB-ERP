// src/components/VendaResumoModal.tsx
import React from 'react';
import './VendaResumoModal.css';
import type { ItemVenda } from '../types';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const VEICULO_REGEX = /\[VEÍCULO: PLACA=(.+?), MODELO=(.+?), COR=(.+?)\]/;

export type VendaResumo = {
  id?: number;
  cliente?: { nome: string; email?: string; telefone?: string } | null;
  dataVenda: string;
  itens: ItemVenda[];
  valorTotal: number;
  formaPagamento?: string;
  descricao?: string; 
};

type Props = {
  open: boolean;
  venda?: VendaResumo | null;
  onClose: () => void;
  onSaveComprovante?: (htmlContent: string) => Promise<void>;
};

const formatPrice = (v?: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

// Para a TELA
const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
};

// Para o PDF (somente data)
const formatDateOnly = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR'); 
};

// Auxiliar Veículo
const extractVehicleInfo = (description?: string): { placa: string | null; modelo: string | null; cor: string | null; isFilled: boolean } | null => {
  if (!description) return null;
  const match = description.match(VEICULO_REGEX);
  
  if (match && match.length === 4) {
    const placa = match[1] !== 'N/A' ? match[1] : null;
    const modelo = match[2] !== 'N/A' ? match[2] : null;
    const cor = match[3] !== 'N/A' ? match[3] : null;
    const isFilled = !!(placa || modelo || cor);
    return { placa, modelo, cor, isFilled };
  }
  return null;
};

const VendaResumoModal: React.FC<Props> = ({ open, venda, onClose, onSaveComprovante }) => {
  if (!open || !venda) return null;

  const veiculoInfo = extractVehicleInfo(venda.descricao);
  const restanteDescricao = venda.descricao?.replace(VEICULO_REGEX, '').replace('|', '').trim() || '';
  
  const isServico = (item: any) => item.isService === true || item.tipo === 'SERVICO';
  const listaProdutos = venda.itens.filter(i => !isServico(i));
  const listaServicos = venda.itens.filter(i => isServico(i));

  // --- HTML PARA O PDF ---
  const gerarHtmlComprovante = () => {
    
    // 1. Cliente
    const clienteHtml = venda.cliente ? `
      <div style="margin-bottom: 5px;"><strong>Cliente:</strong> ${venda.cliente.nome}</div>
    ` : `<div style="margin-bottom: 5px;"><strong>Cliente:</strong> —</div>`;

    // 2. Veículo
    let veiculoHtml = '';
    if (veiculoInfo && veiculoInfo.isFilled) {
        const info = [veiculoInfo.placa, veiculoInfo.modelo, veiculoInfo.cor].filter(Boolean).join(' • ');
        veiculoHtml = `
            <div style="margin-top: 8px; padding: 8px; background: #fff0f0; border-left: 3px solid #f00; width: 100%; box-sizing: border-box;">
                <strong>Veículo:</strong> ${info}
            </div>
        `;
    }
    
    // --- LÓGICA DE OBSERVAÇÃO INTELIGENTE ---
    const temProdutos = listaProdutos.length > 0;
    const temServicos = listaServicos.length > 0;

    // Determina o "Título" da operação baseado nos itens
    let tipoOperacao = 'Venda'; // Padrão
    if (temProdutos && temServicos) {
        tipoOperacao = 'Serviço/Venda';
    } else if (temServicos && !temProdutos) {
        tipoOperacao = 'Serviço';
    }

    // Limpa o texto original (remove "Venda PDV", "PDV" e até o "Venda" antigo para não duplicar)
    let notasUsuario = restanteDescricao
        .replace(/Venda PDV/gi, '')
        .replace(/PDV/gi, '')
        .replace(/Venda/gi, '') // Removemos para usar o nosso label calculado acima
        .replace(/^\s*[-]\s*/, '') // Remove hífen solto no começo se sobrar
        .trim();

    // Monta o texto final: "Serviço" OU "Serviço - Observação manual"
    let textoObsFinal = tipoOperacao;
    if (notasUsuario) {
        textoObsFinal = `${tipoOperacao} - ${notasUsuario}`;
    }

    let obsHtml = `
        <div style="margin-top: 8px; padding: 8px; background: #f8f8f8; font-size: 0.9em; width: 100%; box-sizing: border-box;">
            <strong>Observações:</strong> ${textoObsFinal}
        </div>
    `;
    // ------------------------------------------

    const linhasProdutos = listaProdutos.map(i => `
      <tr>
        <td style="padding:6px 8px;text-align:center;">${i.quantidade}</td>
        <td style="padding:6px 8px;">${i.nomeProduto}</td>
        <td style="padding:6px 8px;text-align:right;">${formatPrice(i.precoUnitario)}</td>
        <td style="padding:6px 8px;text-align:right;">${formatPrice(i.precoTotal)}</td>
      </tr>
    `).join('');

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
        <title>Comprovante</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; color: #222; margin: 0; padding: 20px; width: 100%; box-sizing: border-box; }
          h2 { margin-bottom: 15px; border-bottom: 2px solid #222; padding-bottom: 10px; }
          .info-section { width: 100%; margin-bottom: 20px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border-bottom: 1px solid #eee; }
          th { text-align:left; padding: 8px; background:#f8f8f8; }
          tfoot td { padding: 8px; font-weight: 700; border-top: 2px solid #ddd; }
        </style>
      </head>
      <body>
        <h2>Comprovante</h2>
        <div class="info-section">
            ${clienteHtml}
            <div style="margin-bottom: 5px;"><strong>Data:</strong> ${formatDateOnly(venda.dataVenda)}</div>
            <div style="margin-bottom: 5px;"><strong>Forma Pagamento:</strong> ${venda.formaPagamento ?? '—'}</div>
            ${veiculoHtml}
            ${obsHtml}
        </div>
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
    container.style.padding = '0';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.background = 'white';
    container.innerHTML = html;
    document.body.appendChild(container);

    html2canvas(container, { scale: 3, useCORS: true }).then(canvas => {
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
      
      pdf.save(`Comprovante_${venda.id || 'novo'}.pdf`);
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
            {veiculoInfo && veiculoInfo.isFilled && (
                <div className="vr-veiculo-info">
                    <strong> Veículo: </strong> 
                    {[veiculoInfo.placa, veiculoInfo.modelo, veiculoInfo.cor].filter(Boolean).join(' | ')}
                </div>
            )}
            {venda.cliente?.email && <div><strong>Email:</strong> {venda.cliente.email}</div>}
            <div><strong>Data:</strong> {formatDateTime(venda.dataVenda)}</div>
            <div><strong>Pagamento:</strong> {venda.formaPagamento ?? '—'}</div>
            {restanteDescricao && <div className="vr-obs"><strong>Obs:</strong> {restanteDescricao}</div>}
          </div>

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
              {listaProdutos.map((i, idx) => (
                <tr key={`prod-${idx}`}>
                  <td style={{ textAlign: 'center' }}>{i.quantidade}</td>
                  <td>{i.nomeProduto}</td>
                  <td style={{ textAlign: 'right' }}>{formatPrice(i.precoUnitario)}</td>
                  <td style={{ textAlign: 'right' }}>{formatPrice(i.precoTotal)}</td>
                </tr>
              ))}
              {listaServicos.length > 0 && (
                <>
                  <tr>
                    <td colSpan={4} style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold', paddingTop: '15px', borderBottom: '1px solid #ddd', color: '#555' }}>
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