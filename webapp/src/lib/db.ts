import Dexie, { type EntityTable } from "dexie";
import type { Quote, Topic, MetaEntry, Author, Book } from "./types";

const db = new Dexie("ChristianQuotesDB") as Dexie & {
  quotes: EntityTable<Quote, "id">;
  topics: EntityTable<Topic, "topic">;
  authors: EntityTable<Author, "name">;
  books: EntityTable<Book, "id">;
  meta: EntityTable<MetaEntry, "key">;
};

db.version(1).stores({
  quotes: "id, author, *topics",
  topics: "topic",
  meta: "key",
});

db.version(2).stores({
  quotes: "id, author, *topics, bookId",
  topics: "topic",
  authors: "name",
  books: "++id, authorName, title",
  meta: "key",
});

export { db };
