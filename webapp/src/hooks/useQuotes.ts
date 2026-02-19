"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db";
import type { Quote, Topic } from "@/lib/types";

// Fetch a batch of random quotes, optionally filtered by topic
export function useRandomQuotes(batchSize = 10, topic?: string) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatch = useCallback(async () => {
    setLoading(true);
    try {
      const count = topic
        ? await db.quotes.where("topics").equals(topic).count()
        : await db.quotes.count();

      if (count === 0) {
        setQuotes([]);
        setLoading(false);
        return;
      }

      // Generate random offsets
      const offsets = new Set<number>();
      const maxItems = Math.min(batchSize, count);
      while (offsets.size < maxItems) {
        offsets.add(Math.floor(Math.random() * count));
      }

      const results: Quote[] = [];
      const collection = topic
        ? db.quotes.where("topics").equals(topic)
        : db.quotes.toCollection();

      // Use offset-based random selection
      const sortedOffsets = [...offsets].sort((a, b) => a - b);
      let currentOffset = 0;
      let offsetIdx = 0;

      await collection.each((quote) => {
        if (
          offsetIdx < sortedOffsets.length &&
          currentOffset === sortedOffsets[offsetIdx]
        ) {
          results.push(quote);
          offsetIdx++;
        }
        currentOffset++;
      });

      setQuotes(results);
    } catch (err) {
      console.error("Error fetching quotes:", err);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [batchSize, topic]);

  useEffect(() => {
    void fetchBatch();
  }, [fetchBatch]);

  return { quotes, loading, refetch: fetchBatch };
}

// Get all topics with their colors
export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await db.topics.orderBy("topic").toArray();
        setTopics(all);
      } catch (err) {
        console.error("Error fetching topics:", err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return { topics, loading };
}

// Search quotes by text in quote or author fields
export function useSearchQuotes(query: string) {
  const [results, setResults] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const lower = query.toLowerCase();
        const matches = await db.quotes
          .filter(
            (q) =>
              q.quote.toLowerCase().includes(lower) ||
              q.author.toLowerCase().includes(lower),
          )
          .limit(50)
          .toArray();
        setResults(matches);
      } catch (err) {
        console.error("Error searching quotes:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return { results, loading };
}
