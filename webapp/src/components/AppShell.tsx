"use client";

import { ReactNode } from "react";
import { useQuoteSeeder } from "@/hooks/useQuoteSeeder";
import { LoadingScreen } from "./LoadingScreen";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  const { isSeeding, progress, error } = useQuoteSeeder();

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
