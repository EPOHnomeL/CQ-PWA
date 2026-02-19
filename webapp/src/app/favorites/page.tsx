"use client";

import { Heart, LogIn } from "lucide-react";

export default function FavoritesPage() {
  // TODO: Integrate with Convex auth + favorites query
  // For now, show a placeholder that explains the feature
  const isAuthenticated = false;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-7.5rem)] gap-6 px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-surface-light flex items-center justify-center">
          <Heart size={36} className="text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Your Favorites</h2>
          <p className="text-foreground/50 text-sm leading-relaxed">
            Sign in to save your favorite quotes and access them across all your
            devices.
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary rounded-xl text-white font-medium transition-transform active:scale-95">
          <LogIn size={18} />
          Sign In
        </button>
        <p className="text-foreground/30 text-xs">
          Convex auth will be configured here
        </p>
      </div>
    );
  }

  return null;
}
