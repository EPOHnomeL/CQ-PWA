"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { useQuoteSeeder } from "@/hooks/useQuoteSeeder";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { LoadingScreen } from "./LoadingScreen";
import { InstallScreen } from "./InstallScreen";
import { BottomNav } from "./BottomNav";
import { LogIn, LogOut, User } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const { isSeeding, progress, error } = useQuoteSeeder();
  const { canInstall, isInstalled, isIOS, isMobile, promptInstall } =
    usePWAInstall();
  const { isAuthenticated, openAuthSheet } = useAuthGuard();
  const { signOut } = useAuthActions();
  const currentUser = useQuery(
    api.users.currentUser,
    isAuthenticated ? {} : "skip",
  );
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Show install screen on mobile if not already installed and not dismissed this session
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("cq-install-dismissed");
    if (isMobile && !isInstalled && !dismissed) {
      setShowInstall(true);
    }
  }, [isMobile, isInstalled]);

  const handleInstall = useCallback(async () => {
    const accepted = await promptInstall();
    // Dismiss either way — if they accepted, app will reopen standalone
    sessionStorage.setItem("cq-install-dismissed", "1");
    if (!accepted) {
      setShowInstall(false);
    }
  }, [promptInstall]);

  const handleSkip = useCallback(() => {
    sessionStorage.setItem("cq-install-dismissed", "1");
    setShowInstall(false);
  }, []);

  // Gate 1: Install prompt (mobile only)
  if (showInstall) {
    return (
      <InstallScreen
        canInstall={canInstall}
        isIOS={isIOS}
        onInstall={() => void handleInstall()}
        onSkip={handleSkip}
      />
    );
  }

  // Gate 2: Seeding
  if (isSeeding) {
    return <LoadingScreen progress={progress} error={error} />;
  }

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-surface/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-40 safe-top">
        <div className="w-10" /> {/* Spacer for centering */}
        <h1 className="text-lg font-bold text-primary tracking-wide">
          Christian Quotes
        </h1>
        <div className="relative">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary transition-transform active:scale-95"
                aria-label="User menu"
              >
                {currentUser?.name ? (
                  <span className="text-sm font-bold">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User size={16} />
                )}
              </button>
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-12 w-48 bg-surface border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                    {currentUser?.email && (
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-xs text-foreground/50 truncate">
                          {currentUser.email}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        void signOut();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-foreground/70 hover:bg-white/5 transition-colors"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <button
              onClick={openAuthSheet}
              className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-foreground/40 hover:text-foreground/70 transition-colors"
              aria-label="Sign in"
            >
              <LogIn size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-14 pb-16 relative">
        <div className="max-w-lg mx-auto w-full h-full">{children}</div>
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
