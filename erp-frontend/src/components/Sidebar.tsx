import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, 
  Wrench, FileText, LogOut, DollarSign, MoreHorizontal 
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  // Itens que SEMPRE aparecem no mobile (Prioridade Total)
  const mobilePrimary = [
    { path: '/pdv', label: 'PDV', icon: ShoppingCart },
    { path: '/produtos', label: 'Produtos', icon: Package },
    { path: '/financeiro', label: 'Financeiro', icon: DollarSign },
  ];

  // Itens que vão para o "Mais" no mobile, mas aparecem normal no Desktop
  const otherItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/clientes', label: 'Clientes', icon: Users },
    { path: '/servicos', label: 'Serviços', icon: Wrench },
    { path: '/notas', label: 'Histórico', icon: FileText },
  ];

  const allMenuItems = [...mobilePrimary, ...otherItems];

  return (
    <>
      <aside className="sidebar">
        {/* DESKTOP HEADER */}
        <div className="sidebar-header">
          <div className="brand-container" onClick={() => navigate('/')}>
            <div className="logo-icon"><Wrench size={24} color="#fff" /></div>
            <h1 className="sidebar-logo">B&B Car Sound</h1>
          </div>
        </div>

        {/* NAVEGAÇÃO PRINCIPAL (Desktop: Todos | Mobile: Primários + Botão Mais) */}
        <nav className="sidebar-nav">
          <div className="nav-group-mobile">
            {mobilePrimary.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path} className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>
                  <Icon size={22} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
            
            {/* BOTÃO MAIS - Apenas Mobile */}
            <button className="nav-item btn-more-mobile" onClick={() => setShowMore(!showMore)}>
              <MoreHorizontal size={22} className="nav-icon" />
              <span className="nav-label">Mais</span>
            </button>
          </div>

          {/* ITENS SECUNDÁRIOS - Visíveis no Desktop, Escondidos no Mobile */}
          <div className="nav-group-desktop">
            {otherItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path} className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>
                  <Icon size={22} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* DESKTOP FOOTER */}
        <div className="sidebar-footer">
          <button className="btn-logout"><LogOut size={16} /> Sair</button>
          <p className="copyright">© 2025 ERP B&B</p>
        </div>
      </aside>

      {/* MENU SUSPENSO "MAIS" (Apenas Mobile) */}
      {showMore && (
        <div className="mobile-more-overlay" onClick={() => setShowMore(false)}>
          <div className="mobile-more-menu" onClick={e => e.stopPropagation()}>
            <h3>Menu Completo</h3>
            {otherItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path} onClick={() => setShowMore(false)} className="more-menu-item">
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button className="more-menu-item logout-red"><LogOut size={20} /> Sair</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;