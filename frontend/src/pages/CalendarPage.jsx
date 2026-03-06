import { useState, useEffect, useCallback, useRef } from 'react';
import { bookingService, roomService } from '../services/api';
import { formatDate } from '../utils/formatters';

export default function CalendarPage() {
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [popup, setPopup] = useState(null); // { booking, x, y }
    const popupRef = useRef(null);

    useEffect(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const start = new Date(year, month, 1).toISOString().split('T')[0];
        const end = new Date(year, month + 1, 0).toISOString().split('T')[0];

        setLoading(true);
        Promise.all([bookingService.getCalendar(start, end), roomService.getAll()])
            .then(([b, r]) => { setBookings(b.data.data); setRooms(r.data.data); })
            .catch(console.error).finally(() => setLoading(false));
    }, [currentDate]);

    // Close popup when clicking outside (using ref to avoid race condition)
    useEffect(() => {
        if (!popup) return;
        const handleClickOutside = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                // Don't close if clicking on a booking cell (let handleCellClick handle it)
                if (e.target.closest('.cal-cell-booked')) return;
                setPopup(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [popup]);

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const isRoomBooked = useCallback((roomId, day) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return bookings.find(b => b.room_id === roomId && dateStr >= b.check_in_date.split('T')[0] && dateStr < b.check_out_date.split('T')[0]);
    }, [bookings, currentDate]);

    const handleCellClick = (e, booking) => {
        e.stopPropagation();
        if (!booking) {
            setPopup(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        setPopup({
            booking,
            x: Math.min(rect.left + rect.width / 2, window.innerWidth - 120),
            y: rect.bottom + 6,
        });
    };

    const prevMonth = () => { setPopup(null); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); };
    const nextMonth = () => { setPopup(null); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); };
    const monthLabel = currentDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });

    if (loading) return <div className="loading-container"><div className="spinner" /></div>;
    const days = getDaysInMonth();

    return (
        <div className="cal-page">
            <div className="page-header">
                <div><h1 className="page-title">📅 ปฏิทิน</h1><p className="page-subtitle">สถานะห้องพักรายเดือน — คลิกวันที่จองเพื่อดูรายละเอียด</p></div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <button className="btn btn-ghost" onClick={prevMonth}>◀</button>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)', minWidth: 200, textAlign: 'center' }}>{monthLabel}</span>
                    <button className="btn btn-ghost" onClick={nextMonth}>▶</button>
                </div>
            </div>

            <div className="card cal-card" style={{ overflow: 'auto', padding: 'var(--space-4)', position: 'relative' }}>
                <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <span className="badge badge-success">ว่าง</span>
                    <span className="badge badge-warning">จองแล้ว</span>
                </div>
                <div className="table-container">
                    <table className="data-table cal-table" style={{ fontSize: 'var(--font-size-xs)' }}>
                        <thead>
                            <tr>
                                <th style={{ position: 'sticky', left: 0, background: 'var(--color-bg-secondary)', zIndex: 2 }}>ห้อง</th>
                                {Array.from({ length: days }, (_, i) => <th key={i} style={{ textAlign: 'center', minWidth: 36 }}>{i + 1}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {rooms.map(room => (
                                <tr key={room.id}>
                                    <td style={{ position: 'sticky', left: 0, background: 'var(--color-bg-secondary)', fontWeight: 600, zIndex: 2 }}>{room.room_number}</td>
                                    {Array.from({ length: days }, (_, i) => {
                                        const booking = isRoomBooked(room.id, i + 1);
                                        const isActive = popup && booking && popup.booking.id === booking.id;
                                        return (
                                            <td
                                                key={i}
                                                className={booking ? 'cal-cell-booked' : ''}
                                                onClick={(e) => handleCellClick(e, booking)}
                                                style={{
                                                    textAlign: 'center',
                                                    padding: '4px',
                                                    cursor: booking ? 'pointer' : 'default',
                                                }}
                                            >
                                                {booking && (
                                                    <span
                                                        className="cal-dot"
                                                        style={{
                                                            background: isActive ? 'var(--color-accent)' : 'rgba(245, 158, 11, 0.7)',
                                                        }}
                                                    />
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Booking detail popup */}
            {popup && (
                <div
                    ref={popupRef}
                    className="cal-popup"
                    onClick={(e) => e.stopPropagation()}
                    style={{ left: popup.x, top: popup.y }}
                >
                    <div className="cal-popup-arrow" />
                    <button className="cal-popup-close" onClick={() => setPopup(null)}>✕</button>
                    <div className="cal-popup-name">👤 {popup.booking.guest_name}</div>
                    <div className="cal-popup-phone">📞 {popup.booking.guest_phone || '-'}</div>
                    <div className="cal-popup-dates">
                        📅 {formatDate(popup.booking.check_in_date)} — {formatDate(popup.booking.check_out_date)}
                    </div>
                </div>
            )}

            <style>{`
                /* Disable card hover animation for calendar */
                .cal-card,
                .cal-card:hover {
                    transform: none !important;
                    transition: none !important;
                }

                /* Disable ONLY empty cell hover - booked cells keep their styles */
                .cal-table tr td:not(.cal-cell-booked):hover {
                    background: transparent !important;
                }

                /* Booking dot */
                .cal-dot {
                    display: inline-block;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    transition: transform 0.15s ease;
                }
                .cal-cell-booked:hover .cal-dot {
                    transform: scale(1.3);
                }

                .cal-popup {
                    position: fixed;
                    transform: translateX(-50%);
                    z-index: 999;
                    background: var(--color-bg-secondary);
                    border: 1px solid var(--color-accent);
                    border-radius: var(--radius-lg);
                    padding: var(--space-3) var(--space-4);
                    padding-right: 36px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                    min-width: 180px;
                }
                .cal-popup-arrow {
                    position: absolute;
                    top: -6px;
                    left: 50%;
                    transform: translateX(-50%) rotate(45deg);
                    width: 12px;
                    height: 12px;
                    background: var(--color-bg-secondary);
                    border-top: 1px solid var(--color-accent);
                    border-left: 1px solid var(--color-accent);
                }
                .cal-popup-close {
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    width: 22px;
                    height: 22px;
                    border: none;
                    background: rgba(255,255,255,0.08);
                    color: var(--color-text-muted);
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 0.7rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                }
                .cal-popup-close:hover {
                    background: rgba(255,255,255,0.15);
                    color: var(--color-text-primary);
                }
                .cal-popup-name {
                    font-weight: 700;
                    font-size: var(--font-size-sm);
                    color: var(--color-text-primary);
                    margin-bottom: 2px;
                }
                .cal-popup-phone {
                    font-size: var(--font-size-sm);
                    color: var(--color-accent);
                    margin-bottom: 2px;
                }
                .cal-popup-dates {
                    font-size: var(--font-size-xs);
                    color: var(--color-text-muted);
                }

                @media (max-width: 768px) {
                    .cal-popup {
                        left: 50% !important;
                        max-width: 90vw;
                    }
                }
            `}</style>
        </div>
    );
}
