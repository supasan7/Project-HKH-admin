import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="navbar">
            <div className="navbar-left">
                <h1 className="navbar-page-title">
                    {document.title || 'เฮือนคุ้มฮัก'}
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
      `}</style>
        </header>
    );
}
