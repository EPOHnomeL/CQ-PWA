"use client";

import { Download, Share, PlusSquare, ArrowRight } from "lucide-react";

interface InstallScreenProps {
  canInstall: boolean;
  isIOS: boolean;
  onInstall: () => void;
  onSkip: () => void;
}

export function InstallScreen({
  canInstall,
  isIOS,
  onInstall,
  onSkip,
}: InstallScreenProps) {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 px-8">
      {/* Branding */}
      <div className="text-5xl font-bold text-primary mb-2">CQ</div>
      <p className="text-foreground/70 text-base font-medium mb-1">
        Christian Quotes
      </p>
      <p className="text-foreground/40 text-sm text-center max-w-xs mb-10">
        10,000+ Christian quotes at your fingertips — even offline.
      </p>

      {/* Install content */}
      {canInstall ? (
        /* Android / Chromium — native install prompt available */
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <button
            onClick={onInstall}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-primary text-white rounded-2xl font-semibold text-base shadow-lg shadow-primary/25 active:scale-[0.97] transition-transform"
          >
            <Download size={20} />
            Install App
          </button>
          <p className="text-foreground/30 text-xs text-center">
            Install for the best experience — instant access, works offline, and
            feels like a native app.
          </p>
        </div>
      ) : isIOS ? (
        /* iOS — manual instructions */
        <div className="flex flex-col items-center gap-5 w-full max-w-xs">
          <p className="text-foreground/60 text-sm font-medium">
            Add to your Home Screen:
          </p>
          <div className="space-y-4 w-full">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light">
              <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Share size={18} />
              </div>
              <p className="text-sm text-foreground/70">
                Tap the{" "}
                <span className="font-semibold text-foreground">Share</span>{" "}
                button in Safari
              </p>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light">
              <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <PlusSquare size={18} />
              </div>
              <p className="text-sm text-foreground/70">
                Select{" "}
                <span className="font-semibold text-foreground">
                  Add to Home Screen
                </span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Desktop or prompt not yet available — auto-skip handled in AppShell */
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <p className="text-foreground/40 text-sm text-center">
            For the best experience, visit on your phone and install the app.
          </p>
        </div>
      )}

      {/* Skip / Continue */}
      <button
        onClick={onSkip}
        className="mt-8 flex items-center gap-1.5 text-foreground/40 hover:text-foreground/60 text-sm transition-colors"
      >
        Continue in Browser
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
