import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        // Try to auto-login on startup
        const loadToken = async () => {
            try {
                const savedToken = await AsyncStorage.getItem('auth_token');
                if (savedToken) {
                    setToken(savedToken);
                }
            } catch (e) {
                console.error('Failed to load token', e);
            } finally {
                setIsLoading(false);
            }
        };

        loadToken();
    }, []);

    const login = async (email, password) => {
        setIsLoading(true);
        setAuthError('');
        try {
            const data = await authService.login(email, password);
            if (data.user?.role !== 'security') {
                setAuthError('Only security accounts can sign in to this app.');
                return false;
            }

            if (data.token) {
                await AsyncStorage.setItem('auth_token', data.token);
                setToken(data.token);
                return true;
            }

            setAuthError('Login succeeded but no token was returned.');
            return false;
        } catch (error) {
            console.error('Login error', error);
            setAuthError(error?.response?.data?.message || 'Please check your credentials and try again.');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('auth_token');
            setToken(null);
            setAuthError('');
        } catch (e) {
            console.error('Logout error', e);
        }
    };

    return (
        <AuthContext.Provider value={{ token, isAuthenticated: !!token, isLoading, authError, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
