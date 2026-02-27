import { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { formatDateTime } from '../utils/formatters';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ entity_type: '' });

    const fetchData = () => {
        setLoading(true);
        reportService.getAuditLogs(filter).then(r => setLogs(r.data.data)).catch(console.error).finally(() => setLoading(false));
    };
    useEffect(fetchData, [filter.entity_type]);

    if (loading) return <div className="loading-container"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div><h1 className="page-title">🔍 ประวัติการใช้งาน</h1><p className="page-subtitle">บันทึกทุกการเปลี่ยนแปลง (Immutable Audit Trail)</p></div>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <select className="form-select" style={{ maxWidth: 250 }} value={filter.entity_type} onChange={e => setFilter({ ...filter, entity_type: e.target.value })}>
                    <option value="">ทุกประเภท</option>
                    <option value="user">ผู้ใช้</option>
                    <option value="room">ห้องพัก</option>
                    <option value="booking">การจอง</option>
                    <option value="transaction">การเงิน</option>
                    <option value="adjustment_request">คำขอแก้ไข</option>
                </select>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead><tr><th>เวลา</th><th>ผู้ดำเนินการ</th><th>การกระทำ</th><th>ประเภท</th><th>IP Address</th></tr></thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id}>
                                <td>{formatDateTime(log.created_at)}</td>
                                <td>{log.user_display_name || '-'}</td>
                                <td><span className="badge badge-info">{log.action}</span></td>
                                <td>{log.entity_type}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}>{log.ip_address || '-'}</td>
                            </tr>
                        ))}
                        {logs.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>ยังไม่มีบันทึก</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
