"use client";

import { useState } from "react";
import { useTopics } from "@/hooks/useQuotes";
import { getTextColor } from "@/lib/colors";
import { CardStack } from "@/components/CardStack";
import { ArrowLeft } from "lucide-react";

export default function TopicsPage() {
  const { topics, loading } = useTopics();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  if (selectedTopic) {
    return (
      <div className="h-[calc(100dvh-7.5rem)] flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setSelectedTopic(null)}
            className="p-2 rounded-xl bg-surface-light text-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold">{selectedTopic}</h2>
        </div>
        <div className="flex-1 p-4">
          <CardStack topic={selectedTopic} topics={topics} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Topics</h2>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-surface-light animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-4">
          {topics.map((t) => (
            <button
              key={t.topic}
              onClick={() => setSelectedTopic(t.topic)}
              className="h-20 rounded-2xl flex items-center justify-center px-4 transition-transform active:scale-95"
              style={{
                backgroundColor: t.color,
                color: getTextColor(t.color),
              }}
            >
              <span className="font-semibold text-sm text-center leading-tight">
                {t.topic}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
