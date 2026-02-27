import { useState, useEffect } from 'react';
import { transactionService, bookingService } from '../services/api';
import { formatCurrency, formatDateTime, TX_TYPE, TX_STATUS } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showVoidModal, setShowVoidModal] = useState(null);
    const [voidReason, setVoidReason] = useState('');
    const [slipPreview, setSlipPreview] = useState(null);
    const [filter, setFilter] = useState({ type: '', status: '' });
    const [form, setForm] = useState({ type: 'income', category: '', amount: '', description: '', booking_id: '' });
    const [file, setFile] = useState(null);
    const { isOwner } = useAuth();

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            transactionService.getAll(filter),
            bookingService.getAll({ status: 'active' }),
        ])
            .then(([t, b]) => { setTransactions(t.data.data); setBookings(b.data.data || []); })
            .catch(console.error).finally(() => setLoading(false));
    };
    useEffect(fetchData, [filter.type, filter.status]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return alert('กรุณาแนบรูปสลิป/ใบเสร็จ');
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
        fd.append('attachment', file);
        try { await transactionService.create(fd); setShowModal(false); setFile(null); setForm({ type: 'income', category: '', amount: '', description: '', booking_id: '' }); fetchData(); }
        catch (err) { alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    };

    const handleVerify = async (id) => {
        try { await transactionService.verify(id); fetchData(); } catch (err) { alert(err.response?.data?.message); }
    };

    const handleVoid = async () => {
        if (!voidReason) return alert('กรุณาระบุเหตุผล');
        try { await transactionService.requestVoid(showVoidModal, voidReason); setShowVoidModal(null); setVoidReason(''); fetchData(); alert('ส่งคำขอยกเลิกเรียบร้อย'); }
        catch (err) { alert(err.response?.data?.message); }
    };

    const handleTypeChange = (type) => {
        setForm({ ...form, type, booking_id: type === 'expense' ? '' : form.booking_id });
    };

    const handleBookingSelect = (bookingId) => {
        const b = bookings.find(bk => String(bk.id) === bookingId);
        if (b) {
            setForm({ ...form, booking_id: bookingId, category: 'ค่าห้องพัก', amount: b.total_amount, description: `ค่าห้อง ${b.room_number} - ${b.guest_name}` });
        } else {
            setForm({ ...form, booking_id: bookingId });
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div><h1 className="page-title">💰 การเงิน</h1><p className="page-subtitle">รายรับ-รายจ่ายทั้งหมด</p></div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ บันทึกรายการ</button>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)' }}>
                <select className="form-select" style={{ maxWidth: 200 }} value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })}><option value="">ทุกประเภท</option><option value="income">รายรับ</option><option value="expense">รายจ่าย</option></select>
                <select className="form-select" style={{ maxWidth: 200 }} value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}><option value="">ทุกสถานะ</option><option value="pending">รอยืนยัน</option><option value="verified">ยืนยันแล้ว</option><option value="voided">ยกเลิก</option></select>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead><tr><th>วันที่</th><th>ประเภท</th><th>หมวดหมู่</th><th>จำนวน</th><th>รายละเอียด</th><th>สลิป</th><th>สถานะ</th><th>ผู้บันทึก</th><th>จัดการ</th></tr></thead>
                    <tbody>
                        {transactions.map(t => (
                            <tr key={t.id}>
                                <td>{formatDateTime(t.created_at)}</td>
                                <td><span className={`badge ${TX_TYPE[t.type]?.class}`}>{TX_TYPE[t.type]?.label}</span></td>
                                <td>{t.category}</td>
                                <td style={{ fontWeight: 700, color: t.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)' }}>{formatCurrency(t.amount)}</td>
                                <td>{t.description || '-'}</td>
                                <td>{t.attachment_url && <button className="btn btn-ghost btn-sm" onClick={() => setSlipPreview(t.attachment_url)}>📎 ดู</button>}</td>
                                <td><span className={`badge ${TX_STATUS[t.status]?.class}`}>{TX_STATUS[t.status]?.label}</span></td>
                                <td>{t.created_by_name}</td>
                                <td style={{ display: 'flex', gap: '4px' }}>
                                    {isOwner && t.status === 'pending' && <button className="btn btn-success btn-sm" onClick={() => handleVerify(t.id)}>✓</button>}
                                    {!t.is_voided && <button className="btn btn-danger btn-sm" onClick={() => setShowVoidModal(t.id)}>✕</button>}
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && <tr><td colSpan="9" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>ยังไม่มีรายการ</td></tr>}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2 className="modal-title">บันทึกรายการเงิน</h2><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group"><label className="form-label">ประเภท</label><select className="form-select" value={form.type} onChange={e => handleTypeChange(e.target.value)}><option value="income">💰 รายรับ</option><option value="expense">💸 รายจ่าย</option></select></div>
                            {form.type === 'income' && bookings.length > 0 && (
                                <div className="form-group">
                                    <label className="form-label">🏠 จากการจอง</label>
                                    <select className="form-select" value={form.booking_id} onChange={e => handleBookingSelect(e.target.value)}>
                                        <option value="">-- ไม่ระบุ / รายรับอื่นๆ --</option>
                                        {bookings.map(b => <option key={b.id} value={b.id}>ห้อง {b.room_number} — {b.guest_name} ({formatCurrency(b.total_amount)})</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="form-group"><label className="form-label">หมวดหมู่</label><input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="เช่น ค่าห้องพัก, ค่าไฟ, ค่าสาธารณูปโภค" required /></div>
                            <div className="form-group"><label className="form-label">จำนวนเงิน (บาท)</label><input className="form-input" type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
                            <div className="form-group"><label className="form-label">รายละเอียด</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            <div className="form-group">
                                <label className="form-label">📎 แนบสลิป/ใบเสร็จ <span style={{ color: 'var(--color-danger)' }}>*จำเป็น</span></label>
                                <input className="form-input" type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} required />
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>ยกเลิก</button><button type="submit" className="btn btn-primary">บันทึก</button></div>
                        </form>
                    </div>
                </div>
            )}

            {showVoidModal && (
                <div className="modal-overlay" onClick={() => setShowVoidModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2 className="modal-title">ขอยกเลิกรายการ</h2><button className="modal-close" onClick={() => setShowVoidModal(null)}>✕</button></div>
                        <div className="form-group"><label className="form-label">เหตุผลที่ขอยกเลิก</label><textarea className="form-textarea" value={voidReason} onChange={e => setVoidReason(e.target.value)} placeholder="ระบุเหตุผล..." required /></div>
                        <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setShowVoidModal(null)}>ยกเลิก</button><button className="btn btn-danger" onClick={handleVoid}>ส่งคำขอ</button></div>
                    </div>
                </div>
            )}

            {slipPreview && (
                <div className="modal-overlay" onClick={() => setSlipPreview(null)} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSlipPreview(null)} style={{ position: 'absolute', top: -12, right: -12, background: 'var(--color-danger)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>✕</button>
                        <img src={slipPreview} alt="สลิป" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }} />
                    </div>
                </div>
            )}
        </div>
    );
}

