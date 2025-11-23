/**
 * !! NEW FILE !!
 * 
 *  -> Improve data retrieval and management for lists of users
 *  -> Will be used by teachers and admins to manage the users
 *  -> Will be loaded only one time, reloaded when needed
 * 
 * Manager Context
 * -----------------------------------
 * Context for managing a collection of users under a manager (teacher/admin)
 * Stores:
 * - id: id of the manager
 * - users: map of user objects with their data
 * - loading: fetch state
 * 
 * Allows to:
 * - Load users for a specific manager
 * - Manage the list of users
 * -------------------------------
 */

import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { User, UserData } from '../lib/api';

interface ManagerContextType {
    id: string;
    users: Map<User, UserData>;
    loading: boolean;
    /*
    loadUsers: (managerId: string) => Promise<void>;
    addUser: (user: User) => void;
    removeUser: (userId: string) => void;
    updateUser: (userId: string, updates: Partial<User>) => void;
    */
}

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

/**
 * Context provider
 * 
 * @brief This context is for managing users under a manager (teacher/admin)
 * @param children - children pages that will have access
 * @returns provider that gives the context to the app
 *
 * @example
 * ```tsx
 * <ManagerProvider>
 *   <App />
 * </ManagerProvider>
 * ```
 */
export const ManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const users = new Map<User, UserData>();
    const loading = false; 

    return (
        <ManagerContext.Provider 
        value={{ 
            id: 'manager-id-placeholder',
            users, 
            loading,
            }}
        >
            {children}
        </ManagerContext.Provider>
    );
};

export const useManager = () => {
    const context = useContext(ManagerContext);
    if (context === undefined) {
        throw new Error('useManager must be used within a ManagerProvider');
    }
    return context;
};


/**
 * Hook to access the list of users associated with the manager.
 * 
 * @throws Error if used outside of ManagerProvider.
 * @returns Map of users associated with the manager.
 * @example
 * ```tsx
 * const users = useAssociatedUsers();
 * ```
 */
export const useAssociatedUsers = () => {
    const context = useContext(ManagerContext);
    if (context === undefined) {
        throw new Error('useAssociatedUsers must be used within a ManagerProvider');
    }
    return context.users;
};
