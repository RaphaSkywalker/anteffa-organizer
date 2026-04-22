import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";

interface User {
    id: number;
    username: string;
    name: string;
    email: string;
    role: "admin" | "employee";
    avatar_url?: string;
    team_name?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
    isAuthenticated: boolean;
    api: (endpoint: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { API_URL } from "@/config";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem("auth_user");
        if (!saved || saved === "undefined") return null;
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse auth_user from localStorage", e);
            localStorage.removeItem("auth_user");
            return null;
        }
    });
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem("auth_token");
    });

    const api = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        const headers = {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        };

        if (options.body instanceof FormData) {
            delete (headers as any)["Content-Type"];
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        if (!response.ok) {
            if (isJson) {
                const error = await response.json();
                throw new Error(error.error || "Ocorreu um erro no servidor");
            } else {
                const text = await response.text();
                console.error("Server error (non-JSON):", text);
                throw new Error(`Erro no servidor: ${response.status}`);
            }
        }

        return isJson ? response.json() : response.text();
    }, [token]);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const data = await api("/api/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
            });

            setUser(data.user);
            setToken(data.token);
            localStorage.setItem("auth_user", JSON.stringify(data.user));
            localStorage.setItem("auth_token", data.token);
            return true;
        } catch (error) {
            console.error("Login error:", error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_token");
    };

    const updateUser = (data: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            localStorage.setItem("auth_user", JSON.stringify(updatedUser));
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, api, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
