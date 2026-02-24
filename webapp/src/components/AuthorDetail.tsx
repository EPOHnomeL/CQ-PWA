"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Plus,
  ChevronRight,
  Pencil,
  Info,
  Quote,
  BookOpen,
  Globe,
} from "lucide-react";
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

interface WikiBioState {
  loading: boolean;
  summary: string | null;
  biography: string | null;
  testimony: string | null;
  url: string | null;
  imageUrl: string | null;
  fields: {
    born: string | null;
    died: string | null;
    occupation: string | null;
    nationality: string | null;
    spouseChildren: string | null;
    notableWorks: string | null;
    denomination: string | null;
  };
  notableWorksList: string[];
}

interface WikiSummaryResponse {
  extract?: string;
  thumbnail?: {
    source?: string;
  };
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
  wikibase_item?: string;
}

interface WikidataClaim {
  mainsnak?: {
    snaktype?: string;
    datavalue?: {
      value?: unknown;
    };
  };
}

interface WikidataEntity {
  claims?: Record<string, WikidataClaim[] | undefined>;
  labels?: {
    en?: {
      value?: string;
    };
  };
}

interface WbGetEntitiesResponse {
  entities?: Record<string, WikidataEntity | undefined>;
}

interface WikiExtractResponse {
  query?: {
    pages?: Record<
      string,
      {
        extract?: string;
      }
    >;
  };
}

const EMPTY_FIELDS: WikiBioState["fields"] = {
  born: null,
  died: null,
  occupation: null,
  nationality: null,
  spouseChildren: null,
  notableWorks: null,
  denomination: null,
};

const WIKI_SNIPPET_MAX_CHARS = 250;

function truncateSnippet(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace <= 0) return `${truncated}…`;
  return `${truncated.slice(0, lastSpace)}…`;
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter((paragraph) => paragraph.length > 0);
}

function normalizeTextForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNarrativeRedundant(
  shortText: string | null,
  longText: string | null,
): boolean {
  if (!shortText || !longText) return false;
  const shortNorm = normalizeTextForCompare(shortText);
  const longNorm = normalizeTextForCompare(longText);
  if (!shortNorm || !longNorm) return false;
  return shortNorm.includes(longNorm) || longNorm.includes(shortNorm);
}

function getTestimonySnippet(text: string): string | null {
  const paragraphs = splitIntoParagraphs(text).filter(
    (paragraph) => paragraph.length >= 80,
  );

  const strongPattern =
    /\b(testimony|conversion|converted|born again|saved|salvation|called to preach|call to ministry|came to faith)\b/i;
  const mediumPattern =
    /\b(faith|ministry|gospel|evangel|revival|missionary|preach|christian)\b/i;

  const bestParagraph =
    paragraphs.find((paragraph) => strongPattern.test(paragraph)) ??
    paragraphs.find(
      (paragraph) =>
        mediumPattern.test(paragraph) &&
        /\b(christ|jesus|god)\b/i.test(paragraph),
    );

  if (bestParagraph) {
    return truncateSnippet(bestParagraph, 420);
  }

  const sentence = splitIntoSentences(text).find(
    (line) => strongPattern.test(line) || mediumPattern.test(line),
  );
  if (!sentence) return null;
  return truncateSnippet(sentence, 260);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getClaimValues(
  claims: Record<string, WikidataClaim[] | undefined>,
  propertyId: string,
): unknown[] {
  const propertyClaims = claims[propertyId] ?? [];
  return propertyClaims
    .map((claim) => {
      if (claim.mainsnak?.snaktype !== "value") return undefined;
      return claim.mainsnak.datavalue?.value;
    })
    .filter((value): value is unknown => value !== undefined);
}

function getClaimItemIds(
  claims: Record<string, WikidataClaim[] | undefined>,
  propertyId: string,
): string[] {
  return getClaimValues(claims, propertyId)
    .map((value) => {
      if (!isRecord(value)) return null;
      const id = value.id;
      return typeof id === "string" ? id : null;
    })
    .filter((id): id is string => id !== null);
}

function parseWikidataTime(value: string): string | null {
  const match = /^([+-]\d{1,})-(\d{2})-(\d{2})T/.exec(value);
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);

  if (!Number.isFinite(year)) return null;

  const yearLabel = year < 0 ? `${Math.abs(year)} BCE` : `${Math.abs(year)}`;

  if (month <= 0) {
    return yearLabel;
  }

  const monthLabel = new Date(Date.UTC(2000, month - 1, 1)).toLocaleString(
    "en-US",
    { month: "long" },
  );

  if (day <= 0) {
    return `${monthLabel} ${yearLabel}`;
  }

  return `${monthLabel} ${day}, ${yearLabel}`;
}

function getTimeClaim(
  claims: Record<string, WikidataClaim[] | undefined>,
  propertyId: string,
): string | null {
  const values = getClaimValues(claims, propertyId);
  for (const value of values) {
    if (!isRecord(value)) continue;
    const time = value.time;
    if (typeof time !== "string") continue;
    const parsed = parseWikidataTime(time);
    if (parsed) return parsed;
  }
  return null;
}

function uniqueValues(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(trimmed);
  }
  return result;
}

function formatLabelList(values: string[], max = 4): string | null {
  const list = uniqueValues(values);
  if (list.length === 0) return null;
  if (list.length <= max) return list.join(", ");
  return `${list.slice(0, max).join(", ")} +${list.length - max} more`;
}

async function getWikidataLabels(
  ids: string[],
  signal: AbortSignal,
): Promise<Record<string, string>> {
  const uniqueIds = uniqueValues(ids);
  if (uniqueIds.length === 0) return {};

  const response = await fetch(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(
      uniqueIds.join("|"),
    )}&props=labels&languages=en&format=json&origin=*`,
    {
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) return {};

  const data = (await response.json()) as WbGetEntitiesResponse;
  const entities = data.entities ?? {};
  const labels: Record<string, string> = {};

  for (const [id, entity] of Object.entries(entities)) {
    const label = entity?.labels?.en?.value;
    if (label) {
      labels[id] = label;
    }
  }

  return labels;
}

function mapIdsToLabels(
  ids: string[],
  labelsById: Record<string, string>,
): string[] {
  return uniqueValues(
    ids.map((id) => labelsById[id] ?? id).filter((value) => Boolean(value)),
  );
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
  const [activeTab, setActiveTab] = useState<"details" | "quotes" | "books">(
    "details",
  );
  const [wikiBio, setWikiBio] = useState<WikiBioState>({
    loading: false,
    summary: null,
    biography: null,
    testimony: null,
    url: null,
    imageUrl: null,
    fields: EMPTY_FIELDS,
    notableWorksList: [],
  });

  useEffect(() => {
    const controller = new AbortController();

    const loadWikipediaSummary = async () => {
      setWikiBio({
        loading: true,
        summary: null,
        biography: null,
        testimony: null,
        url: null,
        imageUrl: null,
        fields: EMPTY_FIELDS,
        notableWorksList: [],
      });

      try {
        const response = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(authorName)}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          setWikiBio({
            loading: false,
            summary: null,
            biography: null,
            testimony: null,
            url: null,
            imageUrl: null,
            fields: EMPTY_FIELDS,
            notableWorksList: [],
          });
          return;
        }

        const data = (await response.json()) as WikiSummaryResponse;

        const summary = data.extract?.trim();
        const url = data.content_urls?.desktop?.page ?? null;
        const imageUrl = data.thumbnail?.source ?? null;

        let biography: string | null = null;
        let testimony: string | null = null;

        const extractResponse = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exchars=8000&titles=${encodeURIComponent(
            authorName,
          )}&format=json&origin=*`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (extractResponse.ok) {
          const extractData =
            (await extractResponse.json()) as WikiExtractResponse;
          const pages = extractData.query?.pages ?? {};
          const articleExtract = Object.values(pages)
            .map((page) => page.extract?.trim())
            .find((extract): extract is string => Boolean(extract));

          if (articleExtract) {
            const paragraphs = splitIntoParagraphs(articleExtract);
            const introNarrative = paragraphs.find(
              (paragraph) => paragraph.length > 60,
            );
            if (introNarrative) {
              biography = truncateSnippet(introNarrative, 420);
            }
            testimony = getTestimonySnippet(articleExtract);
          }
        }

        const fields: WikiBioState["fields"] = { ...EMPTY_FIELDS };
        let notableWorksList: string[] = [];

        if (data.wikibase_item) {
          const entityResponse = await fetch(
            `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(
              data.wikibase_item,
            )}&props=claims&format=json&origin=*`,
            {
              signal: controller.signal,
              headers: {
                Accept: "application/json",
              },
            },
          );

          if (entityResponse.ok) {
            const entityData =
              (await entityResponse.json()) as WbGetEntitiesResponse;
            const entity = entityData.entities?.[data.wikibase_item];
            const claims = entity?.claims ?? {};

            const occupationIds = getClaimItemIds(claims, "P106");
            const nationalityIds = getClaimItemIds(claims, "P27");
            const spouseIds = getClaimItemIds(claims, "P26");
            const childrenIds = getClaimItemIds(claims, "P40");
            const notableWorkIds = getClaimItemIds(claims, "P800");
            const religionIds = getClaimItemIds(claims, "P140");

            const labelsById = await getWikidataLabels(
              [
                ...occupationIds,
                ...nationalityIds,
                ...spouseIds,
                ...childrenIds,
                ...notableWorkIds,
                ...religionIds,
              ],
              controller.signal,
            );

            const occupation = mapIdsToLabels(occupationIds, labelsById);
            const nationality = mapIdsToLabels(nationalityIds, labelsById);
            const spouses = mapIdsToLabels(spouseIds, labelsById);
            const children = mapIdsToLabels(childrenIds, labelsById);
            notableWorksList = mapIdsToLabels(notableWorkIds, labelsById);
            const religions = mapIdsToLabels(religionIds, labelsById);

            fields.born = getTimeClaim(claims, "P569");
            fields.died = getTimeClaim(claims, "P570");
            fields.occupation = formatLabelList(occupation);
            fields.nationality = formatLabelList(nationality);
            fields.notableWorks = formatLabelList(notableWorksList, 5);
            fields.denomination = religions[0] ?? null;

            const spouseLine = formatLabelList(spouses, 3);
            const childrenLine = formatLabelList(children, 3);
            if (spouseLine || childrenLine) {
              fields.spouseChildren = [
                spouseLine ? `Spouse: ${spouseLine}` : null,
                childrenLine ? `Children: ${childrenLine}` : null,
              ]
                .filter((part): part is string => part !== null)
                .join(" · ");
            }
          }
        }

        if (!summary) {
          setWikiBio({
            loading: false,
            summary: null,
            biography,
            testimony,
            url,
            imageUrl,
            fields,
            notableWorksList,
          });
          return;
        }

        setWikiBio({
          loading: false,
          summary: truncateSnippet(summary, WIKI_SNIPPET_MAX_CHARS),
          biography: biography ?? truncateSnippet(summary, 420),
          testimony,
          url,
          imageUrl,
          fields,
          notableWorksList,
        });
      } catch {
        if (!controller.signal.aborted) {
          setWikiBio({
            loading: false,
            summary: null,
            biography: null,
            testimony: null,
            url: null,
            imageUrl: null,
            fields: EMPTY_FIELDS,
            notableWorksList: [],
          });
        }
      }
    };

    void loadWikipediaSummary();

    return () => {
      controller.abort();
    };
  }, [authorName]);

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
      void refresh();
    },
    [refresh],
  );

  const booksForTab = useMemo<
    Array<{
      key: string;
      title: string;
      year?: number;
      source: "local" | "wiki";
      id?: number;
    }>
  >(() => {
    const localBooks = books.map((book) => ({
      key: `local-${book.id}`,
      title: book.title,
      year: book.year,
      source: "local" as const,
      id: book.id,
    }));

    const localTitleSet = new Set(
      localBooks.map((book) => book.title.trim().toLowerCase()),
    );

    const wikiBooks = wikiBio.notableWorksList
      .filter((title) => !localTitleSet.has(title.trim().toLowerCase()))
      .map((title, index) => ({
        key: `wiki-${index}`,
        title,
        year: undefined,
        source: "wiki" as const,
        id: undefined,
      }));

    return [...localBooks, ...wikiBooks];
  }, [books, wikiBio.notableWorksList]);

  const detailRows = [
    { label: "Born", value: wikiBio.fields.born },
    { label: "Died", value: wikiBio.fields.died },
    { label: "Occupation", value: wikiBio.fields.occupation },
    { label: "Nationality", value: wikiBio.fields.nationality },
    { label: "Spouse/Children", value: wikiBio.fields.spouseChildren },
    { label: "Notable works", value: wikiBio.fields.notableWorks },
    { label: "Denomination", value: wikiBio.fields.denomination },
  ].filter((row) => Boolean(row.value));

  const narrativeSection = useMemo(() => {
    if (wikiBio.testimony) {
      return {
        title: "Testimony",
        body: wikiBio.testimony,
      };
    }

    if (!wikiBio.biography) return null;
    if (isNarrativeRedundant(wikiBio.summary, wikiBio.biography)) return null;

    return {
      title: "Biography",
      body: wikiBio.biography,
    };
  }, [wikiBio.testimony, wikiBio.biography, wikiBio.summary]);

  return (
    <div className="h-(--app-content-height) flex flex-col">
      <div className="px-4 pt-3 pb-2 shrink-0 space-y-2">
        <div className="relative rounded-2xl overflow-hidden bg-surface-light">
          {wikiBio.imageUrl ? (
            <img
              src={wikiBio.imageUrl}
              alt={authorName}
              className="h-36 sm:h-40 w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-36 sm:h-40 w-full bg-linear-to-br from-primary/35 via-primary/20 to-surface-light flex items-center justify-center">
              <span className="text-5xl font-semibold text-white/90">
                {authorName.charAt(0)}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-background/95 via-background/35 to-transparent" />

          <button
            onClick={onBack}
            className="absolute top-2 left-2 h-10 w-10 rounded-xl bg-background/65 backdrop-blur text-foreground/85 hover:text-foreground transition-colors flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3 pt-10">
            <h2 className="text-lg font-semibold truncate text-white">
              {authorName}
            </h2>
            <p className="text-xs text-white/75">
              {quoteCount} quote{quoteCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="mt-2 h-11 rounded-xl bg-surface-light/70 p-1">
          <div className="grid grid-cols-3 h-full gap-1">
            <button
              onClick={() => setActiveTab("details")}
              title="Details"
              aria-label="Details"
              className={`h-9 w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-2 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === "details"
                  ? "bg-primary text-white"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <Info size={17} />
              <span>Details</span>
            </button>
            <button
              onClick={() => setActiveTab("quotes")}
              title="Quotes"
              aria-label="Quotes"
              className={`h-9 w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-2 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === "quotes"
                  ? "bg-primary text-white"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <Quote size={17} />
              <span>Quotes</span>
            </button>
            <button
              onClick={() => setActiveTab("books")}
              title="Books"
              aria-label="Books"
              className={`h-9 w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-2 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === "books"
                  ? "bg-primary text-white"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <BookOpen size={17} />
              <span>Books</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pb-3 min-h-0">
        {activeTab === "details" ? (
          <div className="h-full overflow-y-auto space-y-2.5 pr-0.5">
            <div className="px-1 py-1">
              <p className="text-xs font-semibold tracking-wide text-foreground/55 uppercase">
                About
              </p>
              {wikiBio.loading ? (
                <p className="mt-1.5 text-sm text-foreground/45">
                  Loading author profile…
                </p>
              ) : wikiBio.summary ? (
                <p className="mt-1.5 text-sm text-foreground/85 leading-relaxed">
                  {wikiBio.summary}
                </p>
              ) : (
                <p className="mt-1.5 text-sm text-foreground/45">
                  No Wikipedia summary found for this author.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-foreground/10 bg-surface-light/55 px-3.5 py-3">
              <p className="text-xs font-semibold tracking-wide text-foreground/55 uppercase">
                Details
              </p>
              {wikiBio.loading ? (
                <p className="mt-1.5 text-sm text-foreground/45">
                  Loading details…
                </p>
              ) : detailRows.length > 0 ? (
                <div className="mt-2 divide-y divide-foreground/10">
                  {detailRows.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[minmax(88px,112px)_1fr] gap-2.5 py-2"
                    >
                      <p className="text-xs font-semibold text-foreground/55">
                        {row.label}
                      </p>
                      <p className="text-sm text-foreground/85 wrap-break-word">
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 text-sm text-foreground/45">
                  No structured details found for this author.
                </p>
              )}

              {wikiBio.url && (
                <a
                  href={wikiBio.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-light transition-colors"
                >
                  Read on Wikipedia
                  <ChevronRight size={12} />
                </a>
              )}
            </div>

            {narrativeSection && (
              <div className="rounded-2xl bg-surface-light/60 px-3.5 py-3 border-l-2 border-primary/45">
                <p className="text-xs font-semibold tracking-wide text-foreground/55 uppercase">
                  {narrativeSection.title}
                </p>
                <p className="mt-1.5 text-sm text-foreground/85 leading-relaxed">
                  {narrativeSection.body}
                </p>
              </div>
            )}
          </div>
        ) : activeTab === "quotes" ? (
          <CardStack author={authorName} topics={topics} />
        ) : (
          <div className="h-full overflow-y-auto space-y-2.5 pr-0.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wide text-foreground/55 uppercase">
                Books
              </p>
              <button
                onClick={() => setShowAddBook(true)}
                className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium bg-surface-light text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus size={12} />
                Add Book
              </button>
            </div>

            {booksLoading && booksForTab.length === 0 ? (
              <div className="rounded-2xl bg-surface-light p-4 text-sm text-foreground/45">
                Loading books…
              </div>
            ) : booksForTab.length > 0 ? (
              <div className="space-y-2">
                {booksForTab.map((book) => (
                  <div
                    key={book.key}
                    className="rounded-xl bg-surface-light px-3.5 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground/90 truncate">
                        {book.title}
                      </p>
                      <div className="text-xs text-foreground/45 mt-0.5 inline-flex items-center gap-1.5">
                        {book.year ? <span>{book.year}</span> : null}
                        {book.source === "wiki" ? (
                          <span className="inline-flex items-center gap-1 text-primary/90">
                            <Globe size={12} />
                            Wiki
                          </span>
                        ) : (
                          <span>Added in app</span>
                        )}
                      </div>
                    </div>

                    {book.source === "local" && book.id !== undefined && (
                      <button
                        onClick={() => {
                          const target =
                            books.find((b) => b.id === book.id) ?? null;
                          setEditingBook(target);
                        }}
                        className="p-2 rounded-lg bg-background/40 text-foreground/60 hover:text-foreground transition-colors"
                        aria-label={`Edit ${book.title}`}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-surface-light p-4 text-sm text-foreground/45">
                No books found for this author yet.
              </div>
            )}
          </div>
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
