import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);

    const login = async (email, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiService.login(email, password);
            setUserToken(response.token);
            setUserData(response.user);
        } catch (e) {
            setError(e.response?.data?.error || 'Login failed');
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (email, password, name) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiService.signup(email, password, name);
            setUserToken(response.token);
            setUserData(response.user);
        } catch (e) {
            setError(e.response?.data?.error || 'Signup failed');
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await apiService.logout();
        } catch (e) {
            console.error(e);
        }
        setUserToken(null);
        setUserData(null);
        setIsLoading(false);
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            const token = await SecureStore.getItemAsync('userToken');
            const user = await SecureStore.getItemAsync('userData');

            if (token) {
                setUserToken(token);
                if (user) {
                    setUserData(JSON.parse(user));
                }
            }
        } catch (e) {
            console.log(`isLoggedIn error: ${e}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, signup, logout, isLoading, userToken, userData, error }}>
            {children}
        </AuthContext.Provider>
    );
};
