"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { useQuoteSeeder } from "@/hooks/useQuoteSeeder";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { LoadingScreen } from "./LoadingScreen";
import { InstallScreen } from "./InstallScreen";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  const { isSeeding, progress, error } = useQuoteSeeder();
  const { canInstall, isInstalled, isIOS, isMobile, promptInstall } =
    usePWAInstall();

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
      <header className="fixed top-0 left-0 right-0 h-14 bg-surface/95 backdrop-blur-md border-b border-white/5 flex items-center justify-center z-40 safe-top">
        <h1 className="text-lg font-bold text-primary tracking-wide">
          Christian Quotes
        </h1>
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
