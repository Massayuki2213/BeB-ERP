// src/components/ProdutoFormModal.tsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Produto } from '../types';
import '../pages/Pages.css'; 

// Ícone de Fechar (X)
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

// Helper para pegar ID (igual ao do Produtos.tsx)
const getProductId = (p: any): number | undefined => {
    if(!p) return undefined;
    return p.idProduto || p.id;
};

type ProdutoFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  produtoToEdit: Produto | null;
};

const initialState = {
  nome: '',
  precoVenda: '' as string | number, 
  precoCusto: '' as string | number,
  quantidadeEstoque: '' as string | number,
  categoria: '',
  descricao: '', 
};

const ProdutoFormModal = ({ isOpen, onClose, onSuccess, produtoToEdit }: ProdutoFormModalProps) => {
  const [formData, setFormData] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditMode = !!produtoToEdit;

  // Popula o formulário ao abrir
  useEffect(() => {
    if (isOpen) {
      if (produtoToEdit) {
        setFormData({
          nome: produtoToEdit.nome,
          precoVenda: produtoToEdit.precoVenda,
          precoCusto: produtoToEdit.precoCusto,
          quantidadeEstoque: produtoToEdit.quantidadeEstoque || 0,
          categoria: produtoToEdit.categoria || '',
          descricao: produtoToEdit.descricao || '', 
        });
      } else {
        setFormData(initialState);
      }
    }
  }, [isOpen, produtoToEdit]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const qtdEstoque = Number(formData.quantidadeEstoque);

    // Payload pronto para o Backend (com valores numéricos seguros)
    const payload = {
      nome: formData.nome,
      categoria: formData.categoria,
      descricao: formData.descricao, 
      precoVenda: Number(formData.precoVenda),
      precoCusto: Number(formData.precoCusto),
      quantidadeEstoque: isNaN(qtdEstoque) ? 0 : Math.round(qtdEstoque),
    };
    
    try {
      if (isEditMode && produtoToEdit) {
        // --- CORREÇÃO PRINCIPAL: PEGAR O ID CORRETO ---
        const idParaEditar = getProductId(produtoToEdit);

        if (!idParaEditar) {
            alert('Erro Crítico: ID do produto não encontrado. Impossível editar.');
            setIsSubmitting(false);
            return;
        }

        // EDIÇÃO (PUT) com o ID correto na URL
        await api.put(`/produtos/${idParaEditar}`, payload);

      } else {
        // CRIAÇÃO (POST)
        await api.post('/produtos', payload);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar produto. Verifique o console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Cabeçalho */}
        <div className="modal-header" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
          <h2 style={{margin: 0}}>{isEditMode ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button 
            type="button" 
            onClick={onClose}
            style={{background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'}}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="form-grid">
          
          <div className="form-group full-width">
            <label htmlFor="nome">Nome do Produto</label>
            <input 
              id="nome" 
              name="nome" 
              value={formData.nome} 
              onChange={handleChange} 
              required 
              placeholder="Ex: Óleo de Motor"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="categoria">Categoria</label>
            <input 
              id="categoria" 
              name="categoria" 
              value={formData.categoria} 
              onChange={handleChange} 
              placeholder="Ex: Peças"
            />
          </div>

          <div className="form-group">
            <label htmlFor="precoCusto">Preço de Custo (R$)</label>
            <input
              type="number"
              id="precoCusto"
              name="precoCusto"
              value={formData.precoCusto}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label htmlFor="precoVenda">Preço de Venda (R$)</label>
            <input
              type="number"
              id="precoVenda"
              name="precoVenda"
              value={formData.precoVenda}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              placeholder="0.00"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="quantidadeEstoque">Quantidade em Estoque</label>
            <input
              type="number"
              id="quantidadeEstoque"
              name="quantidadeEstoque"
              value={formData.quantidadeEstoque}
              onChange={handleChange}
              step="1"
              min="0"
            />
          </div>

          <div className="modal-footer full-width">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProdutoFormModal;