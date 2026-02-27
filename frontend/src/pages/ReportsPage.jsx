import { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const MONTH_NAMES_TH = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const CategoryList = ({ title, items, colorVar }) => (
    items?.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ fontWeight: 600, marginBottom: 'var(--space-3)', color: `var(${colorVar})` }}>{title}</div>
            {items.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span>{c.category} <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>({c.count} รายการ)</span></span>
                    <span style={{ fontWeight: 600, color: `var(${colorVar})` }}>{formatCurrency(c.total)}</span>
                </div>
            ))}
        </div>
    )
);

export default function ReportsPage() {
    const [view, setView] = useState('daily');
    const [daily, setDaily] = useState(null);
    const [monthly, setMonthly] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    const fetchDaily = () => {
        setLoading(true);
        reportService.getDaily(date).then(r => setDaily(r.data.data)).catch(console.error).finally(() => setLoading(false));
    };

    const fetchMonthly = () => {
        setLoading(true);
        reportService.getMonthly(year, month).then(r => setMonthly(r.data.data)).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { view === 'daily' ? fetchDaily() : fetchMonthly(); }, [view, date, year, month]);

    const handleExportPdf = async () => {
        setPdfLoading(true);
        try {
            const res = await reportService.getMonthlyPdfData(year, month);
            const data = res.data.data;
            const { jsPDF } = await import('jspdf');
            await import('jspdf-autotable');

            const doc = new jsPDF('p', 'mm', 'a4');
            const pageW = doc.internal.pageSize.getWidth();
            const monthName = MONTH_NAMES_TH[month - 1];
            const fmtNum = (n) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n);
            const fmtDate = (d) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

            // Header
            doc.setFontSize(18);
            doc.text('HKH Admin', pageW / 2, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text(`Monthly Report: ${monthName} ${year + 543}`, pageW / 2, 22, { align: 'center' });

            let y = 32;

            // Financial Summary
            doc.setFontSize(13);
            doc.text('Financial Summary', 14, y);
            y += 3;
            doc.autoTable({
                startY: y,
                head: [['Item', 'Amount (THB)']],
                body: [
                    ['Total Income', fmtNum(data.totalIncome)],
                    ['Total Expense', fmtNum(data.totalExpense)],
                    ['Net Profit', fmtNum(data.netProfit)],
                ],
                headStyles: { fillColor: [245, 158, 11], textColor: [0, 0, 0], fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 3 },
                columnStyles: { 1: { halign: 'right' } },
                margin: { left: 14, right: 14 },
            });
            y = doc.lastAutoTable.finalY + 8;

            // Income categories
            if (data.incomeCategories?.length > 0) {
                doc.setFontSize(11);
                doc.text('Income Breakdown', 14, y);
                y += 3;
                doc.autoTable({
                    startY: y,
                    head: [['Category', 'Count', 'Total (THB)']],
                    body: data.incomeCategories.map(c => [c.category, c.count, fmtNum(c.total)]),
                    headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255] },
                    styles: { fontSize: 9, cellPadding: 2.5 },
                    columnStyles: { 2: { halign: 'right' } },
                    margin: { left: 14, right: 14 },
                });
                y = doc.lastAutoTable.finalY + 6;
            }

            // Expense categories
            if (data.expenseCategories?.length > 0) {
                doc.setFontSize(11);
                doc.text('Expense Breakdown', 14, y);
                y += 3;
                doc.autoTable({
                    startY: y,
                    head: [['Category', 'Count', 'Total (THB)']],
                    body: data.expenseCategories.map(c => [c.category, c.count, fmtNum(c.total)]),
                    headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
                    styles: { fontSize: 9, cellPadding: 2.5 },
                    columnStyles: { 2: { halign: 'right' } },
                    margin: { left: 14, right: 14 },
                });
                y = doc.lastAutoTable.finalY + 8;
            }

            // Bookings
            if (data.bookings?.length > 0) {
                if (y > 220) { doc.addPage(); y = 15; }
                doc.setFontSize(13);
                doc.text(`Bookings (${data.bookings.length})`, 14, y);
                y += 3;
                const getStatus = (b) => {
                    if (b.is_cancelled) return 'Cancelled';
                    if (b.checked_out_at) return 'Checked Out';
                    if (b.checked_in_at) return 'Checked In';
                    return 'Booked';
                };
                doc.autoTable({
                    startY: y,
                    head: [['Room', 'Guest', 'Phone', 'Check-in', 'Check-out', 'Nights', 'Amount', 'Status']],
                    body: data.bookings.map(b => [
                        b.room_number,
                        b.guest_name,
                        b.guest_phone || '-',
                        fmtDate(b.check_in_date),
                        fmtDate(b.check_out_date),
                        b.nights,
                        fmtNum(parseFloat(b.total_amount)),
                        getStatus(b),
                    ]),
                    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
                    styles: { fontSize: 8, cellPadding: 2 },
                    columnStyles: { 6: { halign: 'right' } },
                    margin: { left: 14, right: 14 },
                });
                y = doc.lastAutoTable.finalY + 8;

                // Booking totals
                const totalBookingAmount = data.bookings.filter(b => !b.is_cancelled).reduce((s, b) => s + parseFloat(b.total_amount), 0);
                const activeBookings = data.bookings.filter(b => !b.is_cancelled).length;
                doc.setFontSize(9);
                doc.text(`Active Bookings: ${activeBookings} | Total Booking Amount: ${fmtNum(totalBookingAmount)} THB`, 14, y);
                y += 8;
            }

            // Transactions
            if (data.transactions?.length > 0) {
                if (y > 220) { doc.addPage(); y = 15; }
                doc.setFontSize(13);
                doc.text(`Transactions (${data.transactions.length})`, 14, y);
                y += 3;
                doc.autoTable({
                    startY: y,
                    head: [['Date', 'Type', 'Category', 'Amount', 'Room', 'Description', 'Status', 'By']],
                    body: data.transactions.map(t => [
                        new Date(t.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' }),
                        t.type === 'income' ? 'Income' : 'Expense',
                        t.category,
                        fmtNum(parseFloat(t.amount)),
                        t.room_number || '-',
                        (t.description || '-').substring(0, 30),
                        t.status,
                        t.created_by_name,
                    ]),
                    headStyles: { fillColor: [100, 116, 139], textColor: [255, 255, 255], fontStyle: 'bold' },
                    styles: { fontSize: 7.5, cellPadding: 1.8 },
                    columnStyles: { 3: { halign: 'right' } },
                    margin: { left: 14, right: 14 },
                });
            }

            // Footer
            const pages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Generated: ${new Date().toLocaleString('th-TH')}`, 14, doc.internal.pageSize.getHeight() - 8);
                doc.text(`Page ${i}/${pages}`, pageW - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
            }

            doc.save(`HKH_Report_${year}_${String(month).padStart(2, '0')}.pdf`);
        } catch (err) {
            console.error(err);
            alert('ไม่สามารถสร้าง PDF ได้');
        } finally {
            setPdfLoading(false);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div><h1 className="page-title">📈 รายงาน</h1><p className="page-subtitle">สรุปรายรับ-รายจ่าย (เฉพาะรายการที่ยืนยันแล้ว)</p></div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <button className={`btn ${view === 'daily' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('daily')}>รายวัน</button>
                    <button className={`btn ${view === 'monthly' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('monthly')}>รายเดือน</button>
                </div>
            </div>

            {view === 'daily' && (
                <>
                    <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                        <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ maxWidth: 250 }} />
                    </div>
                    {daily && (
                        <>
                            {daily.pendingCount > 0 && (
                                <div className="card" style={{ padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                    ⚠️ มีรายการ <strong>รอตรวจสอบ {daily.pendingCount} รายการ</strong> ที่ยังไม่นำมาคิดในรายงาน
                                </div>
                            )}
                            <div className="grid grid-2" style={{ marginBottom: 'var(--space-4)' }}>
                                <div className="card"><div className="stat-label">🏠 รายรับค่าห้องพัก</div><div className="stat-value income" style={{ fontSize: 'var(--font-size-2xl)' }}>{formatCurrency(daily.roomIncome)}</div></div>
                                <div className="card"><div className="stat-label">💰 รายรับอื่นๆ</div><div className="stat-value income" style={{ fontSize: 'var(--font-size-2xl)' }}>{formatCurrency(daily.otherIncome)}</div></div>
                            </div>
                            <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
                                <div className="card"><div className="stat-label">💰 รายรับรวม</div><div className="stat-value income" style={{ fontSize: 'var(--font-size-2xl)' }}>{formatCurrency(daily.totalIncome)}</div></div>
                                <div className="card"><div className="stat-label">💸 รายจ่ายรวม</div><div className="stat-value expense" style={{ fontSize: 'var(--font-size-2xl)' }}>{formatCurrency(daily.totalExpense)}</div></div>
                                <div className="card"><div className="stat-label">📊 สุทธิ</div><div className={`stat-value ${daily.netAmount >= 0 ? 'income' : 'expense'}`} style={{ fontSize: 'var(--font-size-2xl)' }}>{formatCurrency(daily.netAmount)}</div></div>
                            </div>
                            <div className="grid grid-2">
                                <CategoryList title="📥 รายรับแยกตามประเภท" items={daily.incomeCategories} colorVar="--color-success" />
                                <CategoryList title="📤 รายจ่ายแยกตามประเภท" items={daily.expenseCategories} colorVar="--color-danger" />
                            </div>
                        </>
                    )}
                </>
            )}

            {view === 'monthly' && (
                <>
                    <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select className="form-select" style={{ maxWidth: 150 }} value={year} onChange={e => setYear(parseInt(e.target.value))}>{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                        <select className="form-select" style={{ maxWidth: 150 }} value={month} onChange={e => setMonth(parseInt(e.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleDateString('th-TH', { month: 'long' })}</option>)}</select>
                        <button className="btn btn-primary" onClick={handleExportPdf} disabled={pdfLoading} style={{ marginLeft: 'auto' }}>
                            {pdfLoading ? '⏳ กำลังสร้าง...' : '📄 Export PDF'}
                        </button>
                    </div>
                    {monthly && (
                        <>
                            <div className="grid grid-2" style={{ marginBottom: 'var(--space-4)' }}>
                                <div className="card"><div className="stat-label">🏠 รายรับค่าห้องพัก</div><div className="stat-value income" style={{ fontSize: 'var(--font-size-2xl)' }}>{formatCurrency(monthly.roomIncome)}</div></div>
                                <div className="card"><div className="stat-label">💰 รายรับอื่นๆ</div><div className="stat-value income" style={{ fontSize: 'var(--font-size-2xl)' }}>{formatCurrency(monthly.otherIncome)}</div></div>
                            </div>
                            <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
                                <div className="card"><div className="stat-label">💰 รายรับรวม</div><div className="stat-value income" style={{ fontSize: 'var(--font-size-2xl)' }}>{formatCurrency(monthly.totalIncome)}</div></div>
                                <div className="card"><div className="stat-label">💸 รายจ่ายรวม</div><div className="stat-value expense" style={{ fontSize: 'var(--font-size-2xl)' }}>{formatCurrency(monthly.totalExpense)}</div></div>
                                <div className="card"><div className="stat-label">📊 กำไรสุทธิ</div><div className={`stat-value ${monthly.netProfit >= 0 ? 'income' : 'expense'}`} style={{ fontSize: 'var(--font-size-2xl)' }}>{formatCurrency(monthly.netProfit)}</div></div>
                            </div>
                            <div className="grid grid-2" style={{ marginBottom: 'var(--space-6)' }}>
                                <CategoryList title="📥 รายรับแยกตามประเภท" items={monthly.incomeCategories} colorVar="--color-success" />
                                <CategoryList title="📤 รายจ่ายแยกตามประเภท" items={monthly.expenseCategories} colorVar="--color-danger" />
                            </div>
                            {monthly.days?.length > 0 && (
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead><tr><th>วันที่</th><th>รายรับ</th><th>รายจ่าย</th><th>สุทธิ</th></tr></thead>
                                        <tbody>{monthly.days.map(d => (<tr key={d.date}><td>{d.date}</td><td style={{ color: 'var(--color-success)' }}>{formatCurrency(d.income)}</td><td style={{ color: 'var(--color-danger)' }}>{formatCurrency(d.expense)}</td><td style={{ fontWeight: 700, color: d.net >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{formatCurrency(d.net)}</td></tr>))}</tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            <style>{`
        .stat-label { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-2); }
        .stat-value { font-weight: 700; }
        .stat-value.income { color: var(--color-success); }
        .stat-value.expense { color: var(--color-danger); }
      `}</style>
        </div>
    );
}
