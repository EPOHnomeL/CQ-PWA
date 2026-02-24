"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthorDetail } from "@/components/AuthorDetail";
import { useAuthors, useTopics } from "@/hooks/useQuotes";

export default function AuthorDetailPage() {
  const router = useRouter();
  const params = useParams<{ name: string }>();
  const encodedName = params?.name ?? "";

  const authorName = useMemo(() => {
    try {
      return decodeURIComponent(encodedName);
    } catch {
      return encodedName;
    }
  }, [encodedName]);

  const { authors } = useAuthors();
  const { topics } = useTopics();

  const author = useMemo(
    () =>
      authors.find(
        (item) => item.name.toLowerCase() === authorName.toLowerCase(),
      ),
    [authors, authorName],
  );

  return (
    <AuthorDetail
      authorName={authorName}
      quoteCount={author?.quoteCount ?? 0}
      topics={topics}
      onBack={() => router.back()}
    />
  );
}
