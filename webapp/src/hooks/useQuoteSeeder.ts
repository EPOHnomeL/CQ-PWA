"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import type { Quote, Topic } from "@/lib/types";

const DATA_VERSION = "1";

export function useQuoteSeeder() {
  const [isSeeding, setIsSeeding] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function seed() {
      try {
        // Check if data is already seeded
        const existing = await db.meta.get("dataVersion");
        if (existing?.value === DATA_VERSION) {
          setIsSeeding(false);
          return;
        }

        setProgress(5);

        // Fetch data files in parallel
        const [quotesRes, topicsRes] = await Promise.all([
          fetch("/data/quotes2.json"),
          fetch("/data/topics.json"),
        ]);

        if (!quotesRes.ok || !topicsRes.ok) {
          throw new Error("Failed to fetch data files");
        }

        setProgress(20);

        const quotes: Quote[] = await quotesRes.json();
        const topics: Topic[] = await topicsRes.json();

        if (cancelled) return;
        setProgress(40);

        // Clear existing data and seed in a transaction
        await db.transaction(
          "rw",
          [db.quotes, db.topics, db.meta],
          async () => {
            await db.quotes.clear();
            await db.topics.clear();

            // Bulk insert topics (small dataset)
            await db.topics.bulkPut(topics);

            // Bulk insert quotes in chunks to avoid overwhelming memory
            const CHUNK_SIZE = 2000;
            for (let i = 0; i < quotes.length; i += CHUNK_SIZE) {
              if (cancelled) return;
              const chunk = quotes.slice(i, i + CHUNK_SIZE);
              await db.quotes.bulkPut(chunk);
              const pct = 40 + Math.round((i / quotes.length) * 55);
              setProgress(pct);
            }

            // Mark as seeded
            await db.meta.put({ key: "dataVersion", value: DATA_VERSION });
          },
        );

        if (cancelled) return;
        setProgress(100);
        setIsSeeding(false);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load quotes",
          );
          setIsSeeding(false);
        }
      }
    }

    void seed();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isSeeding, progress, error };
}
