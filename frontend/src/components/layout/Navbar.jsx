import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="hamburger-btn" onClick={onMenuToggle}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h1 className="navbar-page-title">
          {document.title || 'เฮือนคุ้มฮัก | HKH Admin'}
        </h1>
      </div>

      <div className="navbar-right">
        <div className="navbar-user">
          <div className="navbar-avatar">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">{user?.displayName}</span>
            <span className="navbar-user-role">
              {user?.role === 'owner' ? '👑 เจ้าของ' : '🛡️ ผู้ดูแล'}
            </span>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: var(--sidebar-width);
          right: 0;
          height: var(--navbar-height);
          background: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-8);
          z-index: 90;
          backdrop-filter: blur(12px);
          transition: left 0.3s ease;
        }
        .navbar-left {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .navbar-page-title {
          font-size: var(--font-size-lg);
          font-weight: 600;
        }
        .navbar-right {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }
        .navbar-user {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .navbar-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #0f172a;
          font-size: var(--font-size-sm);
        }
        .navbar-user-info {
          display: flex;
          flex-direction: column;
        }
        .navbar-user-name {
          font-size: var(--font-size-sm);
          font-weight: 600;
        }
        .navbar-user-role {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        /* Hamburger button */
        .hamburger-btn {
          display: none;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          width: 36px;
          height: 36px;
          padding: 8px;
          background: none;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
        }
        .hamburger-btn span {
          display: block;
          width: 100%;
          height: 2px;
          background: var(--color-text-primary);
          border-radius: 1px;
          transition: all 0.2s ease;
        }
        .hamburger-btn:hover {
          background: var(--color-bg-hover);
        }

        /* Mobile */
        @media (max-width: 768px) {
          .navbar {
            left: 0;
            padding: 0 var(--space-4);
          }
          .hamburger-btn {
            display: flex;
          }
          .navbar-page-title {
            font-size: var(--font-size-base);
            display: none;
          }
          .navbar-user-info {
            display: none;
          }
          .navbar-right {
            gap: var(--space-3);
          }
        }
      `}</style>
    </header>
  );
}
