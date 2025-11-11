import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/pdv', label: 'PDV', icon: '🛒' },
    { path: '/produtos', label: 'Produtos', icon: '📦' },
    { path: '/clientes', label: 'Clientes', icon: '👥' },
    { path: '/servicos', label: 'Serviços', icon: '🔧' },
  ];

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
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
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