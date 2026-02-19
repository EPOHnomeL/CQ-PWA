"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db";
import type { Quote, Topic, Author, Book } from "@/lib/types";

// Fetch a batch of random quotes, optionally filtered by topic or author
export function useRandomQuotes(
  batchSize = 10,
  topic?: string,
  author?: string,
) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatch = useCallback(async () => {
    setLoading(true);
    try {
      let collection;
      if (author) {
        collection = db.quotes.where("author").equals(author);
      } else if (topic) {
        collection = db.quotes.where("topics").equals(topic);
      } else {
        collection = db.quotes.toCollection();
      }

      const count = await collection.count();

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
      // Re-create collection for iteration
      let iterCollection;
      if (author) {
        iterCollection = db.quotes.where("author").equals(author);
      } else if (topic) {
        iterCollection = db.quotes.where("topics").equals(topic);
      } else {
        iterCollection = db.quotes.toCollection();
      }

      const sortedOffsets = [...offsets].sort((a, b) => a - b);
      let currentOffset = 0;
      let offsetIdx = 0;

      await iterCollection.each((quote) => {
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
  }, [batchSize, topic, author]);

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

// Get all authors sorted alphabetically
export function useAuthors(searchQuery?: string) {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        let all = await db.authors.orderBy("name").toArray();
        if (searchQuery && searchQuery.length >= 2) {
          const lower = searchQuery.toLowerCase();
          all = all.filter((a) => a.name.toLowerCase().includes(lower));
        }
        setAuthors(all);
      } catch (err) {
        console.error("Error fetching authors:", err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [searchQuery]);

  return { authors, loading };
}

// Get all books by an author
export function useBooksByAuthor(authorName: string) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await db.books
        .where("authorName")
        .equals(authorName)
        .toArray();
      setBooks(result);
    } catch (err) {
      console.error("Error fetching books:", err);
    } finally {
      setLoading(false);
    }
  }, [authorName]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { books, loading, refresh };
}

// Add a book to IndexedDB
export async function addBook(book: Omit<Book, "id">): Promise<number> {
  const id = await db.books.add(book as Book);
  return id as number;
}

// Update a book in IndexedDB
export async function updateBook(
  id: number,
  updates: Partial<Book>,
): Promise<void> {
  await db.books.update(id, updates);
}

// Delete a book from IndexedDB
export async function deleteBook(id: number): Promise<void> {
  // Unlink any quotes associated with this book
  await db.quotes.where("bookId").equals(id).modify({ bookId: undefined });
  await db.books.delete(id);
}

// Link a quote to a book
export async function linkQuoteToBook(
  quoteId: number,
  bookId: number | undefined,
): Promise<void> {
  await db.quotes.update(quoteId, { bookId });
}

// Get quotes by book ID
export function useQuotesByBook(bookId: number | undefined) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (bookId === undefined) {
          setQuotes([]);
          return;
        }
        const result = await db.quotes.where("bookId").equals(bookId).toArray();
        setQuotes(result);
      } catch (err) {
        console.error("Error fetching quotes by book:", err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [bookId]);

  return { quotes, loading };
}
