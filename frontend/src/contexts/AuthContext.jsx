import { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('hkh_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(false);

    const login = async (username, password) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { username, password });
            const { token, user: userData } = res.data.data;
            localStorage.setItem('hkh_token', token);
            localStorage.setItem('hkh_user', JSON.stringify(userData));
            setUser(userData);
            return userData;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('hkh_token');
        localStorage.removeItem('hkh_user');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isOwner: user?.role === 'owner',
        isAdmin: user?.role === 'admin',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
