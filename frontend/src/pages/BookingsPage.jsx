import { useState, useEffect } from 'react';
import { bookingService, roomService } from '../services/api';
import { formatCurrency, formatDate, formatDateTime, TX_TYPE, TX_STATUS } from '../utils/formatters';

export default function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [detailModal, setDetailModal] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [slipPreview, setSlipPreview] = useState(null);
    const [bookedDates, setBookedDates] = useState([]); // booked date ranges for selected room
    const [dateWarning, setDateWarning] = useState('');
    const [form, setForm] = useState({ room_id: '', guest_name: '', guest_phone: '', check_in_date: '', check_out_date: '', num_guests: 1, notes: '' });

    const today = new Date().toISOString().split('T')[0];

    const fetchData = () => {
        setLoading(true);
        Promise.all([bookingService.getAll({ status: 'active' }), roomService.getAll()])
            .then(([b, r]) => { setBookings(b.data.data); setRooms(r.data.data); })
            .catch(console.error).finally(() => setLoading(false));
    };
    useEffect(fetchData, []);

    // Fetch booked dates when room changes
    const handleRoomChange = async (roomId) => {
        setForm(f => ({ ...f, room_id: roomId, check_in_date: '', check_out_date: '' }));
        setBookedDates([]);
        setDateWarning('');
        if (!roomId) return;
        try {
            const res = await bookingService.getBookedDates(roomId);
            setBookedDates(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    // Check if a date range overlaps with any booked dates
    const checkOverlap = (checkIn, checkOut) => {
        if (!checkIn || !checkOut || bookedDates.length === 0) {
            setDateWarning('');
            return false;
        }
        for (const bd of bookedDates) {
            const bdIn = bd.check_in_date.split('T')[0];
            const bdOut = bd.check_out_date.split('T')[0];
            // Overlap: new check-in < existing check-out AND new check-out > existing check-in
            if (checkIn < bdOut && checkOut > bdIn) {
                setDateWarning(`⚠️ วันที่เลือกซ้อนทับกับการจอง ${formatDate(bdIn)} — ${formatDate(bdOut)}`);
                return true;
            }
        }
        setDateWarning('');
        return false;
    };

    const handleCheckInChange = (ci) => {
        const newForm = { ...form, check_in_date: ci };
        if (form.check_out_date && form.check_out_date <= ci) {
            newForm.check_out_date = '';
        }
        setForm(newForm);
        checkOverlap(ci, newForm.check_out_date);
    };

    const handleCheckOutChange = (co) => {
        setForm(f => ({ ...f, check_out_date: co }));
        checkOverlap(form.check_in_date, co);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (checkOverlap(form.check_in_date, form.check_out_date)) {
            alert('ไม่สามารถจองได้ วันที่เลือกซ้อนทับกับการจองที่มีอยู่แล้ว');
            return;
        }
        try {
            await bookingService.create(form);
            setShowModal(false);
            setForm({ room_id: '', guest_name: '', guest_phone: '', check_in_date: '', check_out_date: '', num_guests: 1, notes: '' });
            setBookedDates([]);
            setDateWarning('');
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    };

    const handleCancel = async (id, e) => {
        e.stopPropagation();
        if (!confirm('ยืนยันการยกเลิกการจอง?')) return;
        try { await bookingService.cancel(id); fetchData(); } catch (err) { alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    };

    const handleCheckIn = async (id, e) => {
        e.stopPropagation();
        if (!confirm('ยืนยันการเช็คอิน?')) return;
        try { await bookingService.checkIn(id); fetchData(); } catch (err) { alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    };

    const handleCheckOut = async (id, e) => {
        e.stopPropagation();
        if (!confirm('ยืนยันการเช็คเอาท์?')) return;
        try { await bookingService.checkOut(id); fetchData(); } catch (err) { alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    };

    const openDetail = async (id) => {
        setDetailLoading(true);
        setDetailModal(null);
        try {
            const res = await bookingService.getById(id);
            setDetailModal(res.data.data);
        } catch (err) { alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
        finally { setDetailLoading(false); }
    };

    const getBookingStatus = (b) => {
        if (b.is_cancelled) return { label: 'ยกเลิก', class: 'badge-danger' };
        if (b.checked_out_at) return { label: 'เช็คเอาท์แล้ว', class: 'badge-default' };
        if (b.checked_in_at) return { label: 'เช็คอินแล้ว', class: 'badge-info' };
        if (!b.has_payment) return { label: 'รอจ่ายเงิน', class: 'badge-danger' };
        return { label: 'รอเช็คอิน', class: 'badge-warning' };
    };

    // Compute min check-out: day after check-in or first booked date after check-in (whichever is sooner)
    const getCheckOutMin = () => {
        if (!form.check_in_date) return '';
        const d = new Date(form.check_in_date);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    };

    // Compute max check-out: earliest booked check-in after our check-in date
    const getCheckOutMax = () => {
        if (!form.check_in_date || bookedDates.length === 0) return '';
        const sortedAfter = bookedDates
            .map(bd => bd.check_in_date.split('T')[0])
            .filter(d => d > form.check_in_date)
            .sort();
        return sortedAfter.length > 0 ? sortedAfter[0] : '';
    };

    if (loading) return <div className="loading-container"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div><h1 className="page-title">📝 การจอง</h1><p className="page-subtitle">จัดการการจองห้องพัก</p></div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ จองห้องพัก</button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead><tr><th>ห้อง</th><th>ชื่อแขก</th><th>เบอร์โทร</th><th>เช็คอิน</th><th>เช็คเอาท์</th><th>ยอดรวม</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
                    <tbody>
                        {bookings.map(b => {
                            const status = getBookingStatus(b);
                            return (
                                <tr key={b.id} onClick={() => openDetail(b.id)} style={{ cursor: 'pointer' }} className="bd-row-clickable">
                                    <td>{b.room_number}</td>
                                    <td>{b.guest_name}</td>
                                    <td>{b.guest_phone || '-'}</td>
                                    <td>
                                        <div>{formatDate(b.check_in_date)}</div>
                                        {b.checked_in_at && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>✅ {formatDateTime(b.checked_in_at)}</div>}
                                    </td>
                                    <td>
                                        <div>{formatDate(b.check_out_date)}</div>
                                        {b.checked_out_at && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>✅ {formatDateTime(b.checked_out_at)}</div>}
                                    </td>
                                    <td style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{formatCurrency(b.total_amount)}</td>
                                    <td><span className={`badge ${status.class}`}>{status.label}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                                            {!b.is_cancelled && !b.checked_in_at && (
                                                <>
                                                    {b.has_payment ? (
                                                        <button className="btn btn-primary btn-sm" onClick={(e) => handleCheckIn(b.id, e)}>📥 เช็คอิน</button>
                                                    ) : (
                                                        <button className="btn btn-ghost btn-sm" disabled title="ต้องอัพโหลดสลิปและยืนยันการชำระเงินก่อน">🔒 รอชำระเงิน</button>
                                                    )}
                                                    <button className="btn btn-danger btn-sm" onClick={(e) => handleCancel(b.id, e)}>ยกเลิก</button>
                                                </>
                                            )}
                                            {b.checked_in_at && !b.checked_out_at && (
                                                <button className="btn btn-warning btn-sm" onClick={(e) => handleCheckOut(b.id, e)}>📤 เช็คเอาท์</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {bookings.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>ยังไม่มีการจอง</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Booking form modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => { setShowModal(false); setBookedDates([]); setDateWarning(''); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2 className="modal-title">จองห้องพัก</h2><button className="modal-close" onClick={() => { setShowModal(false); setBookedDates([]); setDateWarning(''); }}>✕</button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">ห้องพัก</label>
                                <select className="form-select" value={form.room_id} onChange={e => handleRoomChange(e.target.value)} required>
                                    <option value="">เลือกห้อง</option>
                                    {rooms.map(r => <option key={r.id} value={r.id}>ห้อง {r.room_number} - {r.room_type} ({formatCurrency(r.price_per_night)}/คืน)</option>)}
                                </select>
                            </div>
                            <div className="form-group"><label className="form-label">ชื่อแขก</label><input className="form-input" value={form.guest_name} onChange={e => setForm({ ...form, guest_name: e.target.value })} required /></div>
                            <div className="form-group"><label className="form-label">เบอร์โทร</label><input className="form-input" value={form.guest_phone} onChange={e => setForm({ ...form, guest_phone: e.target.value })} /></div>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="form-label">วันเช็คอิน</label>
                                    <input className="form-input" type="date" value={form.check_in_date} min={today} onChange={e => handleCheckInChange(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">วันเช็คเอาท์</label>
                                    <input className="form-input" type="date" value={form.check_out_date} min={getCheckOutMin()} max={getCheckOutMax()} onChange={e => handleCheckOutChange(e.target.value)} required disabled={!form.check_in_date} />
                                </div>
                            </div>
                            {dateWarning && (
                                <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '0.8rem', color: '#f87171', marginBottom: 'var(--space-3)' }}>
                                    {dateWarning}
                                </div>
                            )}
                            {bookedDates.length > 0 && (
                                <div style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '8px', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                                    📅 วันที่จองแล้ว: {bookedDates.map((bd, i) => (
                                        <span key={i} style={{ display: 'inline-block', marginRight: 8 }}>
                                            <span style={{ color: 'var(--color-accent)' }}>{formatDate(bd.check_in_date)} — {formatDate(bd.check_out_date)}</span>{i < bookedDates.length - 1 ? ',' : ''}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="form-group"><label className="form-label">จำนวนผู้เข้าพัก</label><input className="form-input" type="number" min="1" value={form.num_guests} onChange={e => setForm({ ...form, num_guests: parseInt(e.target.value) })} /></div>
                            <div className="form-group"><label className="form-label">หมายเหตุ</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                            <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={() => { setShowModal(false); setBookedDates([]); setDateWarning(''); }}>ยกเลิก</button><button type="submit" className="btn btn-primary" disabled={!!dateWarning}>ยืนยันการจอง</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Loading overlay for detail */}
            {detailLoading && (
                <div className="modal-overlay"><div className="loading-container"><div className="spinner" /></div></div>
            )}

            {/* Booking detail modal */}
            {detailModal && (
                <div className="modal-overlay" onClick={() => setDetailModal(null)}>
                    <div className="modal-content bd-detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">🔍 รายละเอียดการจอง — ห้อง {detailModal.room_number}</h2>
                            <button className="modal-close" onClick={() => setDetailModal(null)}>✕</button>
                        </div>

                        <div className="bd-detail-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="bd-info-section">
                                <h3 className="bd-section-title">📋 ข้อมูลการจอง</h3>
                                <div className="bd-info-grid">
                                    <div className="bd-info-item">
                                        <span className="bd-info-label">ห้อง</span>
                                        <span className="bd-info-value">{detailModal.room_number} ({detailModal.room_type})</span>
                                    </div>
                                    <div className="bd-info-item">
                                        <span className="bd-info-label">ราคา/คืน</span>
                                        <span className="bd-info-value">{formatCurrency(detailModal.price_per_night)}</span>
                                    </div>
                                    <div className="bd-info-item">
                                        <span className="bd-info-label">ชื่อแขก</span>
                                        <span className="bd-info-value bd-guest-name">{detailModal.guest_name}</span>
                                    </div>
                                    <div className="bd-info-item">
                                        <span className="bd-info-label">เบอร์โทร</span>
                                        <span className="bd-info-value">{detailModal.guest_phone || '-'}</span>
                                    </div>
                                    <div className="bd-info-item">
                                        <span className="bd-info-label">เช็คอิน</span>
                                        <span className="bd-info-value">
                                            {formatDate(detailModal.check_in_date)}
                                            {detailModal.checked_in_at && <span className="bd-timestamp"> ✅ {formatDateTime(detailModal.checked_in_at)}</span>}
                                        </span>
                                    </div>
                                    <div className="bd-info-item">
                                        <span className="bd-info-label">เช็คเอาท์</span>
                                        <span className="bd-info-value">
                                            {formatDate(detailModal.check_out_date)}
                                            {detailModal.checked_out_at && <span className="bd-timestamp"> ✅ {formatDateTime(detailModal.checked_out_at)}</span>}
                                        </span>
                                    </div>
                                    <div className="bd-info-item">
                                        <span className="bd-info-label">จำนวนคืน</span>
                                        <span className="bd-info-value">{detailModal.nights} คืน ({detailModal.nights + 1} วัน)</span>
                                    </div>
                                    <div className="bd-info-item">
                                        <span className="bd-info-label">จำนวนผู้เข้าพัก</span>
                                        <span className="bd-info-value">{detailModal.num_guests} คน</span>
                                    </div>
                                    <div className="bd-info-item bd-info-total">
                                        <span className="bd-info-label">ยอดรวม</span>
                                        <span className="bd-info-value bd-total-amount">{formatCurrency(detailModal.total_amount)}</span>
                                    </div>
                                    <div className="bd-info-item">
                                        <span className="bd-info-label">สถานะ</span>
                                        <span className="bd-info-value"><span className={`badge ${getBookingStatus(detailModal).class}`}>{getBookingStatus(detailModal).label}</span></span>
                                    </div>
                                    {detailModal.notes && (
                                        <div className="bd-info-item" style={{ gridColumn: '1 / -1' }}>
                                            <span className="bd-info-label">หมายเหตุ</span>
                                            <span className="bd-info-value">{detailModal.notes}</span>
                                        </div>
                                    )}
                                    <div className="bd-info-item">
                                        <span className="bd-info-label">ผู้บันทึก</span>
                                        <span className="bd-info-value">{detailModal.created_by_name}</span>
                                    </div>
                                    <div className="bd-info-item">
                                        <span className="bd-info-label">วันที่บันทึก</span>
                                        <span className="bd-info-value">{formatDateTime(detailModal.created_at)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bd-info-section">
                                <h3 className="bd-section-title">💰 รายการเงินที่เกี่ยวข้อง</h3>
                                {detailModal.transactions && detailModal.transactions.length > 0 ? (
                                    <div className="bd-tx-list">
                                        {detailModal.transactions.map(tx => {
                                            const typeInfo = TX_TYPE[tx.type] || {};
                                            const statusInfo = TX_STATUS[tx.status] || {};
                                            return (
                                                <div key={tx.id} className="bd-tx-card">
                                                    <div className="bd-tx-header">
                                                        <div className="bd-tx-left">
                                                            <span className={`badge ${typeInfo.class}`}>{typeInfo.label}</span>
                                                            <span className="bd-tx-category">{tx.category}</span>
                                                        </div>
                                                        <span className={`bd-tx-amount ${tx.type === 'income' ? 'bd-amount-income' : 'bd-amount-expense'}`}>
                                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                        </span>
                                                    </div>
                                                    <div className="bd-tx-meta">
                                                        <span>{formatDateTime(tx.created_at)}</span>
                                                        <span>โดย: {tx.created_by_name}</span>
                                                        <span className={`badge ${statusInfo.class}`} style={{ fontSize: '0.65rem' }}>{statusInfo.label}</span>
                                                    </div>
                                                    {tx.description && <div className="bd-tx-desc">{tx.description}</div>}
                                                    {tx.attachment_url && (
                                                        <div className="bd-tx-slip">
                                                            <button className="btn bd-btn-slip" onClick={() => setSlipPreview(tx.attachment_url)}>📎 ดูสลิป</button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bd-no-tx">
                                        <span>📭</span>
                                        <p>ยังไม่มีรายการเงินที่เกี่ยวข้อง</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>สามารถเพิ่มรายการเงินได้ที่หน้า "การเงิน"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Slip preview modal */}
            {slipPreview && (
                <div className="modal-overlay" onClick={() => setSlipPreview(null)} style={{ zIndex: 1100 }}>
                    <div className="bd-slip-viewer" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSlipPreview(null)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>✕</button>
                        <img src={slipPreview} alt="สลิป" className="bd-slip-img" />
                    </div>
                </div>
            )}

            <style>{`
                .bd-row-clickable:hover { background: rgba(255, 255, 255, 0.04) !important; }
                .bd-detail-modal { max-width: 680px; }
                .bd-detail-body { padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-5); }
                .bd-section-title { font-size: 0.95rem; font-weight: 700; margin-bottom: var(--space-3); padding-bottom: var(--space-2); border-bottom: 1px solid rgba(255,255,255,0.08); color: var(--color-text-primary); }
                .bd-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; }
                .bd-info-item { display: flex; flex-direction: column; gap: 2px; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.04); }
                .bd-info-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(148, 163, 184, 0.6); }
                .bd-info-value { font-size: 0.88rem; color: var(--color-text-primary); font-weight: 500; }
                .bd-guest-name { font-weight: 700; font-size: 1rem; }
                .bd-timestamp { font-size: 0.7rem; color: rgba(34, 197, 94, 0.7); display: block; }
                .bd-info-total { background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(249, 115, 22, 0.06)); border-color: rgba(245, 158, 11, 0.15); }
                .bd-total-amount { font-size: 1.2rem !important; font-weight: 800 !important; background: linear-gradient(135deg, #f59e0b, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
                .bd-tx-list { display: flex; flex-direction: column; gap: 10px; }
                .bd-tx-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; transition: border-color 0.2s; }
                .bd-tx-card:hover { border-color: rgba(255,255,255,0.12); }
                .bd-tx-header { display: flex; justify-content: space-between; align-items: center; }
                .bd-tx-left { display: flex; align-items: center; gap: 8px; }
                .bd-tx-category { font-size: 0.82rem; color: var(--color-text-secondary); font-weight: 500; }
                .bd-tx-amount { font-size: 1rem; font-weight: 700; }
                .bd-amount-income { color: #4ade80; }
                .bd-amount-expense { color: #f87171; }
                .bd-tx-meta { display: flex; gap: 12px; font-size: 0.72rem; color: var(--color-text-muted); align-items: center; }
                .bd-tx-desc { font-size: 0.78rem; color: var(--color-text-secondary); }
                .bd-tx-slip { margin-top: 2px; }
                .bd-btn-slip { font-size: 0.75rem; padding: 4px 12px; background: rgba(59, 130, 246, 0.12) !important; border: 1px solid rgba(59, 130, 246, 0.25) !important; color: #60a5fa !important; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
                .bd-btn-slip:hover { background: rgba(59, 130, 246, 0.2) !important; border-color: rgba(59, 130, 246, 0.4) !important; }
                .bd-no-tx { text-align: center; padding: var(--space-6) var(--space-4); color: var(--color-text-muted); }
                .bd-no-tx span { font-size: 2rem; }
                .bd-no-tx p { margin-top: var(--space-2); font-size: 0.85rem; }
                .bd-slip-viewer { position: relative; max-width: 500px; max-height: 90vh; background: var(--color-card); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
                .bd-slip-img { width: 100%; max-height: 85vh; object-fit: contain; display: block; }
            `}</style>
        </div>
    );
}
