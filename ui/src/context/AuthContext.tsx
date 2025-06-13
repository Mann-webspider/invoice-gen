import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/lib/axios";

interface User {
  id: string;
  email: string;
  role: "admin" | "user";
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // const checkSession = async () => {
  //   try {
  //     const token = localStorage.getItem("authToken");
  //     if (token) {
  //       api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  //       const response = await api.get("/check-session");
  //       if (response.data) {
  //         setUser(response.data);
  //       }
  //     }
  //   } catch (error) {
  //     // Session check failed - handled silently
  //     localStorage.removeItem("authToken");
  //     delete api.defaults.headers.common["Authorization"];
  //   }
  // };
  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const response = await api.get("/check-session");
          if (response.data) {
            setUser(response.data.user.sub.user);
          }
        }
      } catch (error) {
        // Session check failed - handled silently
        localStorage.removeItem("authToken");
        delete api.defaults.headers.common["Authorization"];
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) =>  {
    try {
      // Sending login request
      const response = await api.post("/login", { email, password });
      // Login response received
      
      if (response.data && response.data.token) {
        const { token, user } = response.data;
        localStorage.setItem("authToken", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(user);
        return response;
      } 
        
        
        return response;
        // throw new Error(response.data.message || "Login failed");
      
    } catch (error: any) {
      // Login error details handled silently
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // Logout failed - handled silently
    } finally {
      localStorage.removeItem("authToken");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    logout,
    setUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}; 