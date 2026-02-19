"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Book } from "@/lib/types";

interface BookEditorProps {
  authorName: string;
  book?: Book;
  onSave: (book: Omit<Book, "id"> | Book) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function BookEditor({
  authorName,
  book,
  onSave,
  onDelete,
  onClose,
}: BookEditorProps) {
  const [title, setTitle] = useState(book?.title ?? "");
  const [year, setYear] = useState(book?.year?.toString() ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data = {
      ...(book?.id !== undefined ? { id: book.id } : {}),
      title: title.trim(),
      authorName,
      year: year ? parseInt(year, 10) : undefined,
    };
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-surface w-full max-w-md rounded-2xl sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-base font-semibold text-foreground">
            {book ? "Edit Book" : "Add Book"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-light text-foreground/50 hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider">
              Author
            </label>
            <p className="text-sm text-foreground/70">{authorName}</p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="book-title"
              className="text-xs font-medium text-foreground/50 uppercase tracking-wider"
            >
              Title
            </label>
            <input
              id="book-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title..."
              className="w-full h-11 px-4 bg-surface-light rounded-xl text-foreground placeholder:text-foreground/30 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="book-year"
              className="text-xs font-medium text-foreground/50 uppercase tracking-wider"
            >
              Year (optional)
            </label>
            <input
              id="book-year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 1843"
              className="w-full h-11 px-4 bg-surface-light rounded-xl text-foreground placeholder:text-foreground/30 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            {onDelete && book && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors"
              >
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-foreground/50 hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2.5 bg-primary rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-opacity"
            >
              {book ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
