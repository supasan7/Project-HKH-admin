import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
        }
    };

    return (
        <div className="login-page">
            <div className="login-card glass">
                <div className="login-header">
                    <span className="login-icon">🏠</span>
                    <h1 className="login-title">เฮือนคุ้มฮัก</h1>
                    <p className="login-subtitle">ระบบบริหารจัดการโฮมสเตย์</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="login-error">{error}</div>}

                    <div className="form-group">
                        <label className="form-label">ชื่อผู้ใช้</label>
                        <input
                            className="form-input"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="username"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">รหัสผ่าน</label>
                        <input
                            className="form-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>
                </form>
            </div>

            <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(ellipse at top, #1e293b, #0f172a);
        }
        .login-card {
          width: 100%;
          max-width: 420px;
          padding: var(--space-10);
          animation: slideUp var(--transition-slow);
        }
        .login-header {
          text-align: center;
          margin-bottom: var(--space-8);
        }
        .login-icon { font-size: 3rem; display: block; margin-bottom: var(--space-3); }
        .login-title {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          background: linear-gradient(135deg, var(--color-accent), #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .login-subtitle {
          color: var(--color-text-muted);
          font-size: var(--font-size-sm);
          margin-top: var(--space-2);
        }
        .login-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--color-danger);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          margin-bottom: var(--space-5);
        }
      `}</style>
        </div>
    );
}
