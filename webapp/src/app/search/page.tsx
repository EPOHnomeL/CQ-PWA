"use client";

import { useState } from "react";
import { useSearchQuotes } from "@/hooks/useQuotes";
import { Search as SearchIcon, X } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { results, loading } = useSearchQuotes(query);

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Search input */}
      <div className="relative">
        <SearchIcon
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40"
        />
        <input
          type="text"
          placeholder="Search quotes or authors..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-10 bg-surface-light rounded-2xl text-foreground placeholder:text-foreground/30 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-foreground/40 hover:text-foreground/70"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Results */}
      {query.length < 2 ? (
        <div className="flex flex-col items-center justify-center py-16 text-foreground/30">
          <SearchIcon size={48} strokeWidth={1} />
          <p className="mt-4 text-sm">Search through 11,000+ quotes</p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-surface-light animate-pulse"
            />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-foreground/40">
          <p>No quotes found for &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          <p className="text-xs text-foreground/40">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((q) => (
            <div
              key={q.id}
              className="p-4 bg-surface-light rounded-2xl space-y-2"
            >
              <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">
                &ldquo;{q.quote}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-foreground/50">— {q.author}</p>
                <div className="flex gap-1.5">
                  {q.topics.slice(0, 2).map((topic) => (
                    <span
                      key={topic}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary-light"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
