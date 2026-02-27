import { useState, useEffect } from 'react';
import { roomService } from '../services/api';
import { ROOM_STATUS, formatCurrency } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';

const STATUS_ICON = { available: '🟢', booked: '📋', checked_in: '🏨', cleaning: '🧹' };
const TYPE_ICON = { Standard: '🛏️', Deluxe: '✨', Suite: '👑' };

export default function RoomsPage() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editRoom, setEditRoom] = useState(null);
    const [form, setForm] = useState({ room_number: '', room_type: 'Standard', price_per_night: '', description: '', max_guests: 2 });
    const [priceModal, setPriceModal] = useState(null);
    const [cleanModal, setCleanModal] = useState(null);
    const [cleanerName, setCleanerName] = useState('');
    const { isOwner } = useAuth();

    const fetchRooms = () => {
        setLoading(true);
        roomService.getAll().then(r => setRooms(r.data.data)).catch(console.error).finally(() => setLoading(false));
    };
    useEffect(fetchRooms, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editRoom) await roomService.update(editRoom.id, form);
            else await roomService.create(form);
            setShowModal(false); setEditRoom(null);
            setForm({ room_number: '', room_type: 'Standard', price_per_night: '', description: '', max_guests: 2 });
            fetchRooms();
        } catch (err) { alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    };

    const handleEdit = (room) => {
        setEditRoom(room);
        setForm({ room_number: room.room_number, room_type: room.room_type, price_per_night: room.price_per_night, description: room.description || '', max_guests: room.max_guests });
        setShowModal(true);
    };

    const handlePriceSubmit = async (e) => {
        e.preventDefault();
        try { await roomService.updatePrice(priceModal.id, parseFloat(priceModal.price_per_night)); setPriceModal(null); fetchRooms(); }
        catch (err) { alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    };

    const handleCleanSubmit = async (e) => {
        e.preventDefault();
        try { await roomService.markCleaned(cleanModal.id, cleanerName); setCleanModal(null); setCleanerName(''); fetchRooms(); }
        catch (err) { alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    };

    if (loading) return <div className="loading-container"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div><h1 className="page-title">🏠 จัดการห้องพัก</h1><p className="page-subtitle">จัดการข้อมูลห้องพักทั้งหมด</p></div>
                {isOwner && (
                    <button className="btn btn-primary" onClick={() => { setEditRoom(null); setForm({ room_number: '', room_type: 'Standard', price_per_night: '', description: '', max_guests: 2 }); setShowModal(true); }}>+ เพิ่มห้องพัก</button>
                )}
            </div>

            <div className="grid grid-3">
                {rooms.map(room => {
                    const statusInfo = ROOM_STATUS[room.status] || {};
                    const statusIcon = STATUS_ICON[room.status] || '';
                    const typeIcon = TYPE_ICON[room.room_type] || '🛏️';
                    return (
                        <div key={room.id} className={`rc-card rc-status-${room.status}`}>
                            {/* Status ribbon */}
                            <div className={`rc-ribbon ${statusInfo.class}`}>
                                {statusIcon} {statusInfo.label}
                            </div>

                            {/* Room number header */}
                            <div className="rc-number-section">
                                <div className="rc-number-circle">
                                    <span className="rc-number">{room.room_number}</span>
                                </div>
                            </div>

                            {/* Room info */}
                            <div className="rc-body">
                                <div className="rc-type">{typeIcon} {room.room_type}</div>
                                <div className="rc-price-tag">
                                    <span className="rc-price-amount">{formatCurrency(room.price_per_night)}</span>
                                    <span className="rc-price-unit">/ คืน</span>
                                </div>

                                <div className="rc-meta">
                                    <div className="rc-meta-item">
                                        <span className="rc-meta-icon">👥</span>
                                        <span>สูงสุด {room.max_guests} คน</span>
                                    </div>
                                    {room.description && (
                                        <div className="rc-meta-item">
                                            <span className="rc-meta-icon">📝</span>
                                            <span>{room.description}</span>
                                        </div>
                                    )}
                                    {room.cleaned_by && room.status === 'available' && (
                                        <div className="rc-meta-item rc-clean-info">
                                            <span className="rc-meta-icon">🧹</span>
                                            <span>ล่าสุดโดย: {room.cleaned_by}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action footer */}
                            <div className="rc-footer">
                                {room.status === 'cleaning' && (
                                    <button className="btn rc-btn-clean" onClick={() => { setCleanModal({ id: room.id, room_number: room.room_number }); setCleanerName(''); }}>
                                        🧹 ทำความสะอาดเรียบร้อย
                                    </button>
                                )}
                                {isOwner ? (
                                    <button className="btn btn-ghost btn-sm rc-btn-edit" onClick={() => handleEdit(room)} title="แก้ไข">✏️</button>
                                ) : (
                                    <button className="btn btn-ghost btn-sm rc-btn-edit" onClick={() => setPriceModal({ id: room.id, room_number: room.room_number, price_per_night: room.price_per_night })} title="ปรับราคา">💲</button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Owner: Full edit modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editRoom ? 'แก้ไขห้องพัก' : 'เพิ่มห้องพักใหม่'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group"><label className="form-label">เลขห้อง</label><input className="form-input" value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} required /></div>
                            <div className="form-group"><label className="form-label">ประเภทห้อง</label><select className="form-select" value={form.room_type} onChange={e => setForm({ ...form, room_type: e.target.value })}><option>Standard</option><option>Deluxe</option><option>Suite</option></select></div>
                            <div className="form-group"><label className="form-label">ราคา/คืน (บาท)</label><input className="form-input" type="number" min="0" value={form.price_per_night} onChange={e => setForm({ ...form, price_per_night: e.target.value })} required /></div>
                            <div className="form-group"><label className="form-label">จำนวนผู้เข้าพักสูงสุด</label><input className="form-input" type="number" min="1" value={form.max_guests} onChange={e => setForm({ ...form, max_guests: parseInt(e.target.value) })} /></div>
                            <div className="form-group"><label className="form-label">รายละเอียด</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>ยกเลิก</button><button type="submit" className="btn btn-primary">{editRoom ? 'บันทึก' : 'เพิ่มห้อง'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Price modal */}
            {priceModal && (
                <div className="modal-overlay" onClick={() => setPriceModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h2 className="modal-title">💲 ปรับราคาห้อง {priceModal.room_number}</h2><button className="modal-close" onClick={() => setPriceModal(null)}>✕</button></div>
                        <form onSubmit={handlePriceSubmit}>
                            <div className="form-group">
                                <label className="form-label">ราคา/คืน (บาท)</label>
                                <input className="form-input" type="number" min="0" step="0.01" value={priceModal.price_per_night} onChange={e => setPriceModal({ ...priceModal, price_per_night: e.target.value })} required autoFocus />
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>ปรับราคาสำหรับ High / Low Season</p>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={() => setPriceModal(null)}>ยกเลิก</button><button type="submit" className="btn btn-primary">บันทึกราคา</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Cleaning modal */}
            {cleanModal && (
                <div className="modal-overlay" onClick={() => setCleanModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h2 className="modal-title">🧹 ห้อง {cleanModal.room_number} — ทำความสะอาด</h2><button className="modal-close" onClick={() => setCleanModal(null)}>✕</button></div>
                        <form onSubmit={handleCleanSubmit}>
                            <div className="form-group">
                                <label className="form-label">ชื่อผู้ทำความสะอาด *</label>
                                <input className="form-input" value={cleanerName} onChange={e => setCleanerName(e.target.value)} placeholder="ระบุชื่อ-นามสกุล" required autoFocus />
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={() => setCleanModal(null)}>ยกเลิก</button><button type="submit" className="btn btn-primary">✅ ยืนยัน</button></div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                /* ===== Premium Room Card ===== */
                .rc-card {
                    position: relative;
                    background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
                    border-radius: 16px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                }
                .rc-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
                    border-color: rgba(255, 255, 255, 0.12);
                }

                /* Status ribbon */
                .rc-ribbon {
                    position: absolute;
                    top: 14px;
                    right: -2px;
                    padding: 4px 14px 4px 12px;
                    font-size: 0.72rem;
                    font-weight: 700;
                    letter-spacing: 0.3px;
                    border-radius: 6px 0 0 6px;
                    z-index: 2;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }

                /* Room number section */
                .rc-number-section {
                    display: flex;
                    justify-content: center;
                    padding: 28px 20px 12px;
                    background: linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%);
                }
                .rc-number-circle {
                    width: 72px;
                    height: 72px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
                    border: 2px solid rgba(59, 130, 246, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                .rc-card:hover .rc-number-circle {
                    border-color: rgba(59, 130, 246, 0.6);
                    box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
                }
                .rc-number {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: -0.5px;
                }

                /* Status-based accents */
                .rc-status-available .rc-number-circle { border-color: rgba(34, 197, 94, 0.4); background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1)); }
                .rc-status-available:hover .rc-number-circle { border-color: rgba(34, 197, 94, 0.7); box-shadow: 0 0 20px rgba(34, 197, 94, 0.15); }
                .rc-status-booked .rc-number-circle { border-color: rgba(234, 179, 8, 0.4); background: linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(245, 158, 11, 0.1)); }
                .rc-status-booked:hover .rc-number-circle { border-color: rgba(234, 179, 8, 0.7); box-shadow: 0 0 20px rgba(234, 179, 8, 0.15); }
                .rc-status-checked_in .rc-number-circle { border-color: rgba(59, 130, 246, 0.4); background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1)); }
                .rc-status-checked_in:hover .rc-number-circle { border-color: rgba(59, 130, 246, 0.7); box-shadow: 0 0 20px rgba(59, 130, 246, 0.15); }
                .rc-status-cleaning .rc-number-circle { border-color: rgba(239, 68, 68, 0.4); background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(248, 113, 113, 0.1)); }
                .rc-status-cleaning:hover .rc-number-circle { border-color: rgba(239, 68, 68, 0.7); box-shadow: 0 0 20px rgba(239, 68, 68, 0.15); }

                /* Body */
                .rc-body {
                    padding: 12px 20px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    flex: 1;
                }
                .rc-type {
                    text-align: center;
                    font-size: 0.85rem;
                    color: rgba(148, 163, 184, 0.9);
                    font-weight: 500;
                }
                .rc-price-tag {
                    text-align: center;
                    padding: 8px 0;
                }
                .rc-price-amount {
                    font-size: 1.35rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, #f59e0b, #f97316);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .rc-price-unit {
                    font-size: 0.75rem;
                    color: rgba(148, 163, 184, 0.6);
                    margin-left: 4px;
                }

                /* Meta info */
                .rc-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    padding: 10px 12px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.04);
                }
                .rc-meta-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.78rem;
                    color: rgba(148, 163, 184, 0.8);
                }
                .rc-meta-icon {
                    font-size: 0.85rem;
                    width: 20px;
                    text-align: center;
                    flex-shrink: 0;
                }
                .rc-clean-info {
                    color: rgba(34, 197, 94, 0.7);
                }

                /* Footer */
                .rc-footer {
                    display: flex;
                    gap: 8px;
                    padding: 12px 20px 16px;
                    align-items: center;
                    border-top: 1px solid rgba(255, 255, 255, 0.04);
                }
                .rc-btn-clean {
                    flex: 1;
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.15)) !important;
                    border: 1px solid rgba(34, 197, 94, 0.3) !important;
                    color: #4ade80 !important;
                    font-size: 0.8rem;
                    padding: 8px 14px;
                    border-radius: 10px;
                    transition: all 0.2s ease;
                    font-weight: 600;
                }
                .rc-btn-clean:hover {
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.25)) !important;
                    border-color: rgba(34, 197, 94, 0.5) !important;
                    box-shadow: 0 4px 15px rgba(34, 197, 94, 0.2);
                }
                .rc-btn-edit {
                    margin-left: auto;
                    width: 36px;
                    height: 36px;
                    border-radius: 10px !important;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.04) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    transition: all 0.2s ease;
                }
                .rc-btn-edit:hover {
                    background: rgba(255, 255, 255, 0.1) !important;
                    border-color: rgba(255, 255, 255, 0.2) !important;
                }
            `}</style>
        </div>
    );
}
