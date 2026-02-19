import Dexie, { type EntityTable } from "dexie";
import type { Quote, Topic, MetaEntry } from "./types";

const db = new Dexie("ChristianQuotesDB") as Dexie & {
  quotes: EntityTable<Quote, "id">;
  topics: EntityTable<Topic, "topic">;
  meta: EntityTable<MetaEntry, "key">;
};

db.version(1).stores({
  quotes: "id, author, *topics",
  topics: "topic",
  meta: "key",
});

export { db };
