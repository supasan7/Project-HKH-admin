import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
    { path: '/', label: '📊 Dashboard', roles: ['owner', 'admin'] },
    { path: '/calendar', label: '📅 ปฏิทิน', roles: ['owner', 'admin'] },
    { path: '/rooms', label: '🏠 ห้องพัก', roles: ['owner', 'admin'] },
    { path: '/bookings', label: '📝 การจอง', roles: ['owner', 'admin'] },
    { path: '/transactions', label: '💰 การเงิน', roles: ['owner', 'admin'] },
    { path: '/adjustments', label: '📋 คำขอแก้ไข', roles: ['owner'] },
    { path: '/reports', label: '📈 รายงาน', roles: ['owner', 'admin'] },
    { path: '/audit-logs', label: '🔍 ประวัติการใช้งาน', roles: ['owner'] },
];

export default function Sidebar() {
    const { user } = useAuth();

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <span className="sidebar-logo">🏠</span>
                <div>
                    <h2 className="sidebar-title">เฮือนคุ้มฮัก</h2>
                    <p className="sidebar-subtitle">HKH Admin</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems
                    .filter(item => item.roles.includes(user?.role))
                    .map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            {item.label}
                        </NavLink>
                    ))
                }
            </nav>

            <style>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: var(--color-bg-secondary);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          z-index: 100;
          overflow-y: auto;
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-6);
          border-bottom: 1px solid var(--color-border);
        }
        .sidebar-logo { font-size: 2rem; }
        .sidebar-title {
          font-size: var(--font-size-lg);
          font-weight: 700;
          color: var(--color-accent);
        }
        .sidebar-subtitle {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }
        .sidebar-nav {
          flex: 1;
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          font-weight: 500;
          transition: all var(--transition-fast);
          text-decoration: none;
        }
        .sidebar-link:hover {
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
        }
        .sidebar-link.active {
          background: rgba(245, 158, 11, 0.1);
          color: var(--color-accent);
          font-weight: 600;
        }
      `}</style>
        </aside>
    );
}
