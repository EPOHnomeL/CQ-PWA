export interface Quote {
  id: number;
  quote: string;
  topics: string[];
  author: string;
  bookId?: number;
}

export interface Topic {
  topic: string;
  color: string;
}

export interface Author {
  name: string;
  quoteCount: number;
}

export interface Book {
  id?: number;
  title: string;
  authorName: string;
  year?: number;
}

export interface MetaEntry {
  key: string;
  value: string;
}
