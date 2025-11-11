// src/components/ProdutoFormModal.tsx
import { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api'; // Seu 'api' service
import type { Produto } from '../types'; // Nosso 'types'

type ProdutoFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Para atualizar a lista de produtos no pai
  produtoToEdit: Produto | null; // Se for 'null', é modo "Criar". Se tiver um produto, é "Editar"
};

// Estado inicial do formulário
const initialState = {
  nome: '',
  precoVenda: 0,
  precoCusto: 0,
  quantidadeEstoque: 0,
};

const ProdutoFormModal = ({ isOpen, onClose, onSuccess, produtoToEdit }: ProdutoFormModalProps) => {
  const [formData, setFormData] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const isEditMode = produtoToEdit !== null;

  // Efeito para popular o formulário quando for modo de edição
  useEffect(() => {
    if (isEditMode) {
      // Garante que o formulário é populado apenas com os campos necessários
      setFormData({
        nome: produtoToEdit.nome,
        precoVenda: produtoToEdit.precoVenda,
        precoCusto: produtoToEdit.precoCusto,
        quantidadeEstoque: produtoToEdit.quantidadeEstoque || 0,
      });
    } else {
      setFormData(initialState); // Limpa o formulário para "Novo Produto"
    }
  }, [produtoToEdit, isEditMode, isOpen]); // 'isOpen' garante que limpe ao abrir

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    // Normaliza os dados do formulário antes de enviar
    const produtoData = {
      nome: formData.nome,
      precoVenda: typeof formData.precoVenda === 'string' ? parseFloat(formData.precoVenda) || 0 : formData.precoVenda || 0,
      precoCusto: typeof formData.precoCusto === 'string' ? parseFloat(formData.precoCusto) || 0 : formData.precoCusto || 0,
      quantidadeEstoque: typeof formData.quantidadeEstoque === 'string' ? parseInt(formData.quantidadeEstoque) || 0 : formData.quantidadeEstoque || 0,
    };

    try {
      if (isEditMode && produtoToEdit) {
        // Tentar PUT (RESTful). Se o backend não aceitar PUT, tentar PATCH e por último POST /{id}
        try {
          await api.put(`/produtos/${produtoToEdit.id}`, produtoData);
        } catch (putErr: any) {
          const status = putErr?.response?.status;
          console.warn('PUT falhou com status', status, '; tentando PATCH...', putErr);
          if (status === 405) {
            try {
              await api.patch(`/produtos/${produtoToEdit.id}`, produtoData);
            } catch (patchErr: any) {
              const patchStatus = patchErr?.response?.status;
              console.warn('PATCH falhou com status', patchStatus, '; tentando POST /{id}...', patchErr);
              // tentativa final: POST com id na url (alguns backends usam convenção diferente)
              await api.post(`/produtos/${produtoToEdit.id}`, produtoData);
            }
          } else {
            // Se não for 405, relança para ser tratada pelo catch externo
            throw putErr;
          }
        }
      } else {
        // Criação normal
        await api.post('/produtos', produtoData);
      }

      onSuccess(); // Avisa o componente pai para recarregar a lista
      onClose(); // Fecha o modal
    } catch (err: any) {
      console.error('Erro ao salvar produto:', err);
      const status = err?.response?.status;
      if (status === 405) {
        setFormError('Método não permitido no servidor (405). Verifique o endpoint ou o CORS no backend.');
      } else if (status === 0 || !status) {
        setFormError('Erro de conexão com o servidor. Verifique se o backend está rodando.');
      } else {
        setFormError('Erro ao salvar produto. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Editar Produto' : 'Novo Produto'}>
      <form onSubmit={handleSubmit} className="modal-form">

        <div className="form-group">
          <label htmlFor="nome">Nome</label>
          <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label htmlFor="precoVenda">Preço (Venda)</label>
            <input
              type="number"
              id="precoVenda"
              name="precoVenda"
              value={formData.precoVenda || ''}
              onChange={handleChange}
              onFocus={(e) => e.target.select()}
              placeholder="0.00"

            />
          </div>
          <div className="form-group">
            <label htmlFor="precoCusto">Preço (Custo)</label>
            <input
              type="number"
              id="precoCusto"
              name="precoCusto"
              value={formData.precoCusto || ''}
              onChange={handleChange}
              onFocus={(e) => e.target.select()}
              placeholder="0.00"

            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="quantidadeEstoque">Quantidade em Estoque</label>
          <input
            type="number"
            id="quantidadeEstoque"
            name="quantidadeEstoque"
            value={formData.quantidadeEstoque || ''}
            onChange={handleChange}
            onFocus={(e) => e.target.select()}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        {formError && <div className="error-message">{formError}</div>}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProdutoFormModal;