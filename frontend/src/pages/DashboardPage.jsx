import { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { formatCurrency } from '../utils/formatters';

export default function DashboardPage() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        reportService.getDaily(today)
            .then(res => setSummary(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-container"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">📊 Dashboard</h1>
                    <p className="page-subtitle">สรุปภาพรวมวันนี้</p>
                </div>
            </div>

            <div className="grid grid-4">
                <div className="card stat-card">
                    <div className="stat-icon income">💰</div>
                    <div className="stat-info">
                        <span className="stat-label">รายรับวันนี้</span>
                        <span className="stat-value income">{formatCurrency(summary?.totalIncome || 0)}</span>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon expense">💸</div>
                    <div className="stat-info">
                        <span className="stat-label">รายจ่ายวันนี้</span>
                        <span className="stat-value expense">{formatCurrency(summary?.totalExpense || 0)}</span>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon net">📈</div>
                    <div className="stat-info">
                        <span className="stat-label">สุทธิ</span>
                        <span className={`stat-value ${(summary?.netAmount || 0) >= 0 ? 'income' : 'expense'}`}>
                            {formatCurrency(summary?.netAmount || 0)}
                        </span>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon room">🏠</div>
                    <div className="stat-info">
                        <span className="stat-label">อัตราเข้าพัก</span>
                        <span className="stat-value">{summary?.roomSummary?.occupancyRate || 0}%</span>
                    </div>
                    <div className="stat-detail">
                        {summary?.roomSummary?.occupied || 0} / {summary?.roomSummary?.total || 0} ห้อง
                    </div>
                </div>
            </div>

            <div className="grid grid-2" style={{ marginTop: 'var(--space-8)' }}>
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--space-4)' }}>🏠 สถานะห้องพัก</h3>
                    <div className="room-stats">
                        <div className="room-stat-item">
                            <span className="badge badge-success">ว่าง</span>
                            <span>{summary?.roomSummary?.available || 0} ห้อง</span>
                        </div>
                        <div className="room-stat-item">
                            <span className="badge badge-warning">ไม่ว่าง</span>
                            <span>{summary?.roomSummary?.occupied || 0} ห้อง</span>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: 'var(--space-4)' }}>📋 สรุปรายการ</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        จำนวนรายการวันนี้: <strong>{summary?.transactionCount || 0}</strong> รายการ
                    </p>
                </div>
            </div>

            <style>{`
        .stat-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .stat-icon {
          font-size: 2rem;
        }
        .stat-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }
        .stat-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }
        .stat-value {
          font-size: var(--font-size-xl);
          font-weight: 700;
        }
        .stat-value.income { color: var(--color-success); }
        .stat-value.expense { color: var(--color-danger); }
        .stat-detail {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }
        .room-stats {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .room-stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-2) 0;
        }
      `}</style>
        </div>
    );
}
