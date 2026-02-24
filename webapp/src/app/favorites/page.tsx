"use client";

import { Heart, LogIn } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTopics } from "@/hooks/useQuotes";
import {
  buildTopicColorMap,
  getQuoteColor,
  getQuoteGradient,
  getTextColor,
} from "@/lib/colors";
import { useCallback, useMemo } from "react";

export default function FavoritesPage() {
  const { isAuthenticated, openAuthSheet } = useAuthGuard();
  const { topics } = useTopics();
  const favorites = useQuery(
    api.favorites.getFavorites,
    isAuthenticated ? {} : "skip",
  );
  const removeFavorite = useMutation(api.favorites.removeFavorite);

  const topicColorMap = useMemo(() => buildTopicColorMap(topics), [topics]);

  const handleRemove = useCallback(
    (quoteId: number) => {
      void removeFavorite({ quoteId });
    },
    [removeFavorite],
  );

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-(--app-content-height) gap-6 px-8 text-center">
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
        <button
          onClick={openAuthSheet}
          className="flex items-center gap-2 px-6 py-3 bg-primary rounded-xl text-white font-medium transition-transform active:scale-95"
        >
          <LogIn size={18} />
          Sign In
        </button>
      </div>
    );
  }

  if (!favorites) {
    return (
      <div className="flex items-center justify-center h-(--app-content-height)">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-(--app-content-height) gap-4 px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center">
          <Heart size={28} className="text-foreground/30" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold">No Favorites Yet</h2>
          <p className="text-foreground/50 text-sm">
            Tap the heart on any quote to save it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-(--app-content-height) overflow-y-auto px-4 py-4 space-y-4">
      <h2 className="text-lg font-bold text-foreground px-1">
        Your Favorites ({favorites.length})
      </h2>
      {favorites.map((fav) => {
        const color = getQuoteColor(fav.topics, topicColorMap);
        const gradient = getQuoteGradient(fav.topics, topicColorMap);
        const textColor = getTextColor(color);

        return (
          <div
            key={fav._id}
            className="rounded-2xl p-5 shadow-lg relative overflow-hidden"
            style={{ background: gradient, color: textColor }}
          >
            {/* Topic badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {fav.topics.map((topic) => (
                <span
                  key={topic}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm"
                  style={{
                    backgroundColor:
                      textColor === "#ffffff"
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.1)",
                  }}
                >
                  {topic}
                </span>
              ))}
            </div>

            {/* Quote */}
            <blockquote className="text-sm leading-relaxed font-serif italic mb-3">
              &ldquo;{fav.quote}&rdquo;
            </blockquote>

            {/* Author + Remove */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold opacity-80">— {fav.author}</p>
              <button
                onClick={() => handleRemove(fav.quoteId)}
                className="p-2 rounded-full backdrop-blur-sm transition-transform active:scale-90"
                style={{
                  backgroundColor:
                    textColor === "#ffffff"
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.1)",
                }}
                aria-label="Remove from favorites"
              >
                <Heart size={16} fill="currentColor" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
