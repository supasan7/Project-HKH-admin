import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import RoomsPage from './pages/RoomsPage';
import BookingsPage from './pages/BookingsPage';
import TransactionsPage from './pages/TransactionsPage';
import AdjustmentsPage from './pages/AdjustmentsPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogsPage from './pages/AuditLogsPage';

function OwnerRoute({ children }) {
    const { isOwner } = useAuth();
    return isOwner ? children : <Navigate to="/" replace />;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/calendar" element={<CalendarPage />} />
                        <Route path="/rooms" element={<RoomsPage />} />
                        <Route path="/bookings" element={<BookingsPage />} />
                        <Route path="/transactions" element={<TransactionsPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/adjustments" element={<OwnerRoute><AdjustmentsPage /></OwnerRoute>} />
                        <Route path="/audit-logs" element={<OwnerRoute><AuditLogsPage /></OwnerRoute>} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
