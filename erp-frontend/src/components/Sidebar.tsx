import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Calendar, Wallet,
  Package, Users, Car, Wrench, Receipt,
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

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1
          className="sidebar-logo"
          style={{ cursor: 'pointer' }}
          onClick={() => (window.location.href = '/')}
        >
          B&B Car Sound
        </h1>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(({ path, label, Icon }) => (
          <Link
            key={path}
            to={path}
            className={`nav-item ${location.pathname === path ? 'active' : ''}`}
          >
            <Icon className="nav-icon" size={18} strokeWidth={2} />
            <span className="nav-label">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>© 2025 ERP B&B</p>
      </div>
    </aside>
  );
};

export default Sidebar;
