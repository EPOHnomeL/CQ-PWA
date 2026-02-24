"use client";

import { CardStack } from "@/components/CardStack";
import { useTopics } from "@/hooks/useQuotes";

export default function HomePage() {
  const { topics } = useTopics();

  return (
    <div className="h-(--app-content-height) p-4">
      <CardStack topics={topics} />
    </div>
  );
}
