import { useState, useEffect } from 'react';
import { transactionService } from '../services/api';
import { formatDateTime, formatCurrency, ADJ_STATUS } from '../utils/formatters';

export default function AdjustmentsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = () => {
        setLoading(true);
        transactionService.getAdjustments({}).then(r => setRequests(r.data.data)).catch(console.error).finally(() => setLoading(false));
    };
    useEffect(fetchData, []);

    const handleApprove = async (id) => {
        if (!confirm('ยืนยันการอนุมัติ?')) return;
        try { await transactionService.approveAdjustment(id); fetchData(); } catch (err) { alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    };

    const handleReject = async (id) => {
        if (!confirm('ยืนยันการปฏิเสธ?')) return;
        try { await transactionService.rejectAdjustment(id); fetchData(); } catch (err) { alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    };

    if (loading) return <div className="loading-container"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div><h1 className="page-title">📋 คำขอแก้ไข/ยกเลิก</h1><p className="page-subtitle">อนุมัติหรือปฏิเสธคำขอจากผู้ดูแล</p></div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead><tr><th>วันที่ขอ</th><th>ประเภท</th><th>เหตุผล</th><th>จำนวนเงิน</th><th>ผู้ขอ</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
                    <tbody>
                        {requests.map(r => (
                            <tr key={r.id}>
                                <td>{formatDateTime(r.created_at)}</td>
                                <td><span className="badge badge-warning">{r.request_type === 'void' ? 'ยกเลิก' : 'แก้ไข'}</span></td>
                                <td>{r.reason}</td>
                                <td style={{ fontWeight: 600 }}>{r.old_data?.amount ? formatCurrency(r.old_data.amount) : '-'}</td>
                                <td>{r.requested_by_name}</td>
                                <td><span className={`badge ${ADJ_STATUS[r.status]?.class}`}>{ADJ_STATUS[r.status]?.label}</span></td>
                                <td style={{ display: 'flex', gap: '4px' }}>
                                    {r.status === 'pending' && (
                                        <>
                                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(r.id)}>✓ อนุมัติ</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleReject(r.id)}>✕ ปฏิเสธ</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {requests.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>ยังไม่มีคำขอ</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
