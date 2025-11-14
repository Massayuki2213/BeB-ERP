import React from 'react';
import '../pages/ProductSearch.css';

interface Props {
  search: string;
  setSearch: (val: string) => void;
  minQtd: string;
  setMinQtd: (val: string) => void;
  maxQtd: string;
  setMaxQtd: (val: string) => void;
}

const ProductFilters: React.FC<Props> = ({ 
  search, setSearch, 
  minQtd, setMinQtd, 
  maxQtd, setMaxQtd 
}) => {
  return (
    <div className="filters-container">
      {/* Busca Geral */}
      <div className="filter-group" style={{ flex: 2 }}>
        <label>Buscar Produto</label>
        <input
          type="text"
          className="filter-input"
          placeholder="Nome, ID ou Preço..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filtro de Quantidade (De... Até...) */}
      <div className="filter-group">
        <label>Qtd. Mínima</label>
        <input
          type="number"
          className="filter-input"
          placeholder="0"
          value={minQtd}
          onChange={(e) => setMinQtd(e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>Qtd. Máxima</label>
        <input
          type="number"
          className="filter-input"
          placeholder="Ex: 100"
          value={maxQtd}
          onChange={(e) => setMaxQtd(e.target.value)}
        />
      </div>
    </div>
  );
};

export default ProductFilters;