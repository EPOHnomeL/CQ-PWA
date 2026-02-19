"use client";

import { CardStack } from "@/components/CardStack";
import { useTopics } from "@/hooks/useQuotes";

export default function HomePage() {
  const { topics } = useTopics();

  return (
    <div className="h-[calc(100dvh-7.5rem)] p-4">
      <CardStack topics={topics} />
    </div>
  );
}
