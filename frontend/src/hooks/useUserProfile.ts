import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import type { User } from '../types';

export const useUserProfile = () => {
  const { user, token, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (userData: Partial<User>) => {
    if (!token) {
      setError('No hay token de autenticación');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedUser = await apiService.updateUserProfile(token, userData);
      updateUser(updatedUser);
      return updatedUser;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [token, updateUser]);

  return {
    user,
    updateProfile,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

export const useAdminUsers = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) {
      setError('No hay token de autenticación');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const usersData = await apiService.getAllUsers(token);
      setUsers(usersData);
      return usersData;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
    if (!token) {
      setError('No hay token de autenticación');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedUser = await apiService.updateUserById(token, userId, userData);
      setUsers(prevUsers => 
        prevUsers.map(user => user._id === userId ? updatedUser : user)
      );
      return updatedUser;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  return {
    users,
    fetchUsers,
    updateUser,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};
