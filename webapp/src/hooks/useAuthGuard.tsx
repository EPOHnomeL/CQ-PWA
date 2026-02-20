"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useConvexAuth } from "convex/react";
import { AuthBottomSheet } from "@/components/AuthBottomSheet";

interface AuthGuardContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  requireAuth: (callback?: () => void) => boolean;
  openAuthSheet: () => void;
}

const AuthGuardContext = createContext<AuthGuardContextType>({
  isAuthenticated: false,
  isLoading: true,
  requireAuth: () => false,
  openAuthSheet: () => {},
});

export function useAuthGuard() {
  return useContext(AuthGuardContext);
}

export function AuthGuardProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(
    null,
  );

  const requireAuth = useCallback(
    (callback?: () => void) => {
      if (isAuthenticated) {
        callback?.();
        return true;
      }
      // Store the callback for after sign-in
      if (callback) {
        setPendingCallback(() => callback);
      }
      setShowAuth(true);
      return false;
    },
    [isAuthenticated],
  );

  const openAuthSheet = useCallback(() => {
    setShowAuth(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowAuth(false);
    setPendingCallback(null);
  }, []);

  const handleAuthenticated = useCallback(() => {
    setShowAuth(false);
    pendingCallback?.();
    setPendingCallback(null);
  }, [pendingCallback]);

  return (
    <AuthGuardContext.Provider
      value={{ isAuthenticated, isLoading, requireAuth, openAuthSheet }}
    >
      {children}
      <AuthBottomSheet
        isOpen={showAuth}
        onClose={handleClose}
        onAuthenticated={handleAuthenticated}
      />
    </AuthGuardContext.Provider>
  );
}
