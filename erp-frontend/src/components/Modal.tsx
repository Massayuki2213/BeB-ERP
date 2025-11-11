// src/components/Modal.tsx
import React from 'react';
import './Modal.css'; // Vamos criar este arquivo de CSS

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    // O overlay (fundo) que fecha o modal ao clicar
    <div className="modal-overlay" onClick={onClose}>
      {/* O conteúdo do modal, que impede o fechamento ao clicar dentro dele */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;