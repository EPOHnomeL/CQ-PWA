"use client";

import { useState, useMemo } from "react";
import { useAuthors } from "@/hooks/useQuotes";
import { useRouter } from "next/navigation";
import { Search, User, ChevronRight } from "lucide-react";

export default function AuthorsPage() {
  const router = useRouter();
  const { authors, loading } = useAuthors();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return authors;
    const q = search.toLowerCase();
    return authors.filter((a) => a.name.toLowerCase().includes(q));
  }, [authors, search]);

  // Group by first letter
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const a of filtered) {
      const letter = a.name.charAt(0).toUpperCase() || "#";
      const arr = map.get(letter) ?? [];
      arr.push(a);
      map.set(letter, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="flex flex-col h-(--app-content-height)">
      {/* Sticky header + search */}
      <div className="px-4 pt-4 pb-2 space-y-3 shrink-0">
        <h2 className="text-xl font-bold">Authors</h2>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search authors…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-light text-sm text-foreground placeholder:text-foreground/30 outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </div>
      </div>

      {/* Author list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="space-y-3 mt-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-2xl bg-surface-light animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-foreground/40 gap-3">
            <User size={40} strokeWidth={1} />
            <p className="text-sm">No authors found.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-1">
            {grouped.map(([letter, letterAuthors]) => (
              <div key={letter}>
                <div className="sticky top-0 bg-background/90 backdrop-blur-sm py-1 z-10">
                  <span className="text-xs font-bold text-primary/70 uppercase tracking-wider">
                    {letter}
                  </span>
                </div>
                <div className="space-y-1">
                  {letterAuthors.map((author) => (
                    <button
                      key={author.name}
                      onClick={() =>
                        router.push(
                          `/authors/${encodeURIComponent(author.name)}`,
                        )
                      }
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-light active:scale-[0.98] transition-all group min-h-11"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold">
                          {author.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate">
                          {author.name}
                        </p>
                        <p className="text-[11px] text-foreground/40">
                          {author.quoteCount} quote
                          {author.quoteCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-foreground/20 group-hover:text-foreground/40 transition-colors shrink-0"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
