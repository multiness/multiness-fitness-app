import { createContext, useContext, ReactNode } from "react";

interface AdminContextType {
  isAdmin: boolean;
}

const AdminContext = createContext<AdminContextType>({ isAdmin: false });

export function AdminProvider({ children }: { children: ReactNode }) {
  // TODO: Implement actual admin check logic
  const isAdmin = true; // Temporarily set to true for development

  return (
    <AdminContext.Provider value={{ isAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
