export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  documentType?: string;
  documentNumber?: string;
  role: 'admin' | 'participant';
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}