// src/components/ConfirmDeleteModal.tsx
import Modal from './Modal';

type ConfirmDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
};

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, isLoading }: ConfirmDeleteModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Exclusão">
      <p>Tem certeza que deseja excluir este produto?</p>
      
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onClose} disabled={isLoading}>
          Cancelar
        </button>
        <button className="btn-small btn-delete" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;