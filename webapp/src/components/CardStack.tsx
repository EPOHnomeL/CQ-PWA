"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { QuoteCard } from "./QuoteCard";
import { useRandomQuotes } from "@/hooks/useQuotes";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  buildTopicColorMap,
  getQuoteColor,
  getQuoteGradient,
} from "@/lib/colors";
import type { Quote, Topic } from "@/lib/types";
import { RefreshCw } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface CardStackProps {
  topic?: string;
  author?: string;
  topics: Topic[];
}

export function CardStack({ topic, author, topics }: CardStackProps) {
  const { quotes, loading, refetch } = useRandomQuotes(15, topic, author);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [topicColorMap, setTopicColorMap] = useState<Map<string, string>>(
    new Map(),
  );
  const { isAuthenticated } = useAuthGuard();

  // Convex favorites mutations
  const addFavorite = useMutation(api.favorites.addFavorite);
  const removeFavorite = useMutation(api.favorites.removeFavorite);
  const favorites = useQuery(
    api.favorites.getFavorites,
    isAuthenticated ? {} : "skip",
  );

  // Build a Set of favorited quote IDs for quick lookup
  const favoritedIds = useMemo(
    () => new Set(favorites?.map((f) => f.quoteId) ?? []),
    [favorites],
  );

  useEffect(() => {
    setTopicColorMap(buildTopicColorMap(topics));
  }, [topics]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [quotes]);

  const handleSwipe = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      // When we're running low on cards, fetch more
      if (next >= quotes.length - 3) {
        void refetch();
      }
      return next;
    });
  }, [quotes.length, refetch]);

  const handleFavorite = useCallback(
    (quote: Quote) => {
      if (!isAuthenticated) return;

      const isFav = favoritedIds.has(quote.id);
      if (isFav) {
        void removeFavorite({ quoteId: quote.id });
      } else {
        void addFavorite({
          quoteId: quote.id,
          quote: quote.quote,
          author: quote.author,
          topics: quote.topics,
        });
      }
    },
    [isAuthenticated, favoritedIds, addFavorite, removeFavorite],
  );

  if (loading && quotes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin">
          <RefreshCw size={24} className="text-primary" />
        </div>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-foreground/50">
        <p>No quotes found</p>
        <button
          onClick={() => void refetch()}
          className="px-4 py-2 bg-primary rounded-lg text-white text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show up to 3 cards in the stack
  const visibleQuotes = quotes.slice(currentIndex, currentIndex + 3);

  if (visibleQuotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-foreground/50">
        <p className="text-lg">You&apos;ve seen them all!</p>
        <button
          onClick={() => void refetch()}
          className="px-6 py-3 bg-primary rounded-xl text-white font-medium flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Load More
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full card-stack">
      <AnimatePresence>
        {visibleQuotes
          .map((quote, i) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              color={getQuoteColor(quote.topics, topicColorMap)}
              gradient={getQuoteGradient(quote.topics, topicColorMap)}
              onSwipe={handleSwipe}
              onFavorite={handleFavorite}
              isFavorited={favoritedIds.has(quote.id)}
              isFront={i === 0}
            />
          ))
          .reverse()}
      </AnimatePresence>
    </div>
  );
}
