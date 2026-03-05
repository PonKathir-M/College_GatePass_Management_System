import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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
        try {
            const data = await authService.login(email, password);
            if (data.token) {
                await AsyncStorage.setItem('auth_token', data.token);
                setToken(data.token);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('auth_token');
            setToken(null);
        } catch (e) {
            console.error('Logout error', e);
        }
    };

    return (
        <AuthContext.Provider value={{ token, isAuthenticated: !!token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
