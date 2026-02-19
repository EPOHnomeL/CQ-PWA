"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, BookOpen, Plus, ChevronRight, Pencil } from "lucide-react";
import {
  useBooksByAuthor,
  addBook,
  updateBook,
  deleteBook,
} from "@/hooks/useQuotes";
import { CardStack } from "./CardStack";
import { BookEditor } from "./BookEditor";
import type { Topic, Book } from "@/lib/types";

interface AuthorDetailProps {
  authorName: string;
  quoteCount: number;
  topics: Topic[];
  onBack: () => void;
}

export function AuthorDetail({
  authorName,
  quoteCount,
  topics,
  onBack,
}: AuthorDetailProps) {
  const {
    books,
    loading: booksLoading,
    refresh,
  } = useBooksByAuthor(authorName);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [view, setView] = useState<"quotes" | "book">("quotes");
  const [selectedBookId, setSelectedBookId] = useState<number | undefined>();

  const handleSaveBook = useCallback(
    async (bookData: Omit<Book, "id"> | Book) => {
      if ("id" in bookData && bookData.id !== undefined) {
        await updateBook(bookData.id, bookData);
      } else {
        await addBook(bookData);
      }
      setEditingBook(null);
      setShowAddBook(false);
      void refresh();
    },
    [refresh],
  );

  const handleDeleteBook = useCallback(
    async (id: number) => {
      await deleteBook(id);
      setEditingBook(null);
      if (selectedBookId === id) {
        setSelectedBookId(undefined);
        setView("quotes");
      }
      void refresh();
    },
    [selectedBookId, refresh],
  );

  return (
    <div className="h-[calc(100dvh-7.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button
          onClick={
            view === "book"
              ? () => {
                  setView("quotes");
                  setSelectedBookId(undefined);
                }
              : onBack
          }
          className="p-2 rounded-xl bg-surface-light text-foreground/70 hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">{authorName}</h2>
          <p className="text-xs text-foreground/40">
            {quoteCount} quote{quoteCount !== 1 ? "s" : ""}
            {selectedBookId !== undefined &&
            books.find((b) => b.id === selectedBookId)
              ? ` · ${books.find((b) => b.id === selectedBookId)!.title}`
              : ""}
          </p>
        </div>
      </div>

      {/* Books horizontal scroll */}
      <div className="px-4 pb-3 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => {
              setView("quotes");
              setSelectedBookId(undefined);
            }}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition-colors ${
              view === "quotes" && selectedBookId === undefined
                ? "bg-primary text-white"
                : "bg-surface-light text-foreground/60 hover:text-foreground"
            }`}
          >
            All Quotes
          </button>

          {!booksLoading &&
            books.map((book) => (
              <button
                key={book.id}
                onClick={() => {
                  setSelectedBookId(book.id);
                  setView("book");
                }}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors group ${
                  selectedBookId === book.id
                    ? "bg-primary text-white"
                    : "bg-surface-light text-foreground/60 hover:text-foreground"
                }`}
              >
                <BookOpen size={12} />
                <span className="max-w-[120px] truncate">{book.title}</span>
                {book.year && <span className="opacity-50">({book.year})</span>}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingBook(book);
                  }}
                  className="opacity-0 group-hover:opacity-100 ml-0.5 transition-opacity"
                >
                  <Pencil size={10} />
                </button>
              </button>
            ))}

          <button
            onClick={() => setShowAddBook(true)}
            className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium bg-surface-light text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus size={12} />
            Add Book
          </button>
        </div>
      </div>

      {/* Quote cards */}
      <div className="flex-1 px-4 pb-4">
        {view === "book" && selectedBookId !== undefined ? (
          <BookQuotesView bookId={selectedBookId} topics={topics} />
        ) : (
          <CardStack author={authorName} topics={topics} />
        )}
      </div>

      {/* Book editor modal */}
      {(showAddBook || editingBook) && (
        <BookEditor
          authorName={authorName}
          book={editingBook ?? undefined}
          onSave={(b) => void handleSaveBook(b)}
          onDelete={
            editingBook?.id !== undefined
              ? () => void handleDeleteBook(editingBook.id!)
              : undefined
          }
          onClose={() => {
            setShowAddBook(false);
            setEditingBook(null);
          }}
        />
      )}
    </div>
  );
}

// Sub-component for showing quotes linked to a specific book
function BookQuotesView({
  bookId,
  topics,
}: {
  bookId: number;
  topics: Topic[];
}) {
  // We reuse CardStack but need book-based filtering
  // For now, show a message since book-quote linking is manual
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-foreground/40">
      <BookOpen size={48} strokeWidth={1} />
      <div className="text-center space-y-1">
        <p className="text-sm">No quotes linked to this book yet.</p>
        <p className="text-xs text-foreground/30">
          Link quotes to books from the quote view.
        </p>
      </div>
    </div>
  );
}
