import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Calendar, Wallet,
  Package, Users, Car, Wrench, Receipt, Menu, X,
} from 'lucide-react';
import './Sidebar.css';

const menuItems = [
  { path: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/pdv', label: 'PDV', Icon: ShoppingCart },
  { path: '/ordens-servico', label: 'Ordens de Serviço', Icon: ClipboardList },
  { path: '/agenda', label: 'Agenda / Box', Icon: Calendar },
  { path: '/financeiro', label: 'Financeiro', Icon: Wallet },
  { path: '/produtos', label: 'Produtos', Icon: Package },
  { path: '/clientes', label: 'Clientes', Icon: Users },
  { path: '/veiculos', label: 'Veículos', Icon: Car },
  { path: '/servicos', label: 'Serviços', Icon: Wrench },
  { path: '/notas', label: 'Notas', Icon: Receipt },
];

const Sidebar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // No celular, fecha o menu sempre que troca de página
  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <>
      {/* Barra superior — só aparece no celular */}
      <header className="mobile-topbar">
        <button className="hamburger" aria-label="Abrir menu" onClick={() => setOpen(true)}>
          <Menu size={22} />
        </button>
        <span className="mobile-brand">B&amp;B Car Sound</span>
      </header>

      {/* Fundo escuro ao abrir o menu no celular */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1
            className="sidebar-logo"
            style={{ cursor: 'pointer' }}
            onClick={() => (window.location.href = '/')}
          >
            B&amp;B Car Sound
          </h1>
          <button className="sidebar-close" aria-label="Fechar menu" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(({ path, label, Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon className="nav-icon" size={18} strokeWidth={2} />
              <span className="nav-label">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>© 2025 ERP B&amp;B</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
