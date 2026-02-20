import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('user');
      setIsAuthenticated(false);
    }
  }, [user]);

  const login = (email, password) => {
    // Simple authentication (in production, use Firebase/JWT)
    const userData = {
      email,
      name: email.split('@')[0],
      role: email.includes('mentor') || email.includes('admin') ? 'mentor' : 'user',
    };
    setUser(userData);
    return Promise.resolve(userData);
  };

  const signup = (email, password, name) => {
    const userData = {
      email,
      name,
      role: 'user',
    };
    setUser(userData);
    return Promise.resolve(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

