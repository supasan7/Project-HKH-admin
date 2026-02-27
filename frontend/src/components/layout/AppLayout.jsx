import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Navbar />
                <div className="page-content animate-fade-in">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
