'use client'

import React, { createContext, useContext } from 'react';
import { useGlobalPresence, type GlobalPresenceState, type GlobalPresenceContextValue } from '@/hooks/use-global-presence';

// Update context default value shape
const defaultContextValue: GlobalPresenceContextValue = {
  presenceState: {},
  isLoading: true, // Default to loading
};

const GlobalPresenceContext = createContext<GlobalPresenceContextValue>(defaultContextValue);

// Define props for the provider
interface GlobalPresenceProviderProps {
  children: React.ReactNode;
  userId?: string; // Accept optional userId
}

// Provider component passes userId to the hook
export const GlobalPresenceProvider = ({ children, userId }: GlobalPresenceProviderProps) => {
  // Pass userId to the hook
  const presenceInfo = useGlobalPresence({ userId }); 

  return (
    <GlobalPresenceContext.Provider value={presenceInfo}>
      {children}
    </GlobalPresenceContext.Provider>
  );
};

// Update consumer hook to handle the new shape and default
export const useGlobalPresenceContext = () => {
  const context = useContext(GlobalPresenceContext);
  // Context should ideally not be null if provider is used correctly,
  // but return default shape just in case.
  return context || defaultContextValue;
}; 