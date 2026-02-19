export interface Quote {
  id: number;
  quote: string;
  topics: string[];
  author: string;
}

export interface Topic {
  topic: string;
  color: string;
}

export interface MetaEntry {
  key: string;
  value: string;
}
