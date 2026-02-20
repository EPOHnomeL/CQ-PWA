"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { useQuoteSeeder } from "@/hooks/useQuoteSeeder";
import { useTopics } from "@/hooks/useQuotes";
import {
  buildTopicColorMap,
  getQuoteColor,
  getQuoteGradient,
  getTextColor,
} from "@/lib/colors";
import type { Quote } from "@/lib/types";
import { ArrowLeft, Copy, Share2, Heart, Check } from "lucide-react";
import { useCallback } from "react";

export default function QuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isSeeding } = useQuoteSeeder();
  const { topics } = useTopics();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isSeeding) return;

    async function loadQuote() {
      try {
        const quoteId = parseInt(id, 10);
        if (isNaN(quoteId)) {
          setNotFound(true);
          return;
        }
        const result = await db.quotes.get(quoteId);
        if (result) {
          setQuote(result);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
    }

    void loadQuote();
  }, [id, isSeeding]);

  const handleCopy = useCallback(async () => {
    if (!quote) return;
    const quoteUrl = `https://cq-pwa.vercel.app/quote/${quote.id}`;
    try {
      await navigator.clipboard.writeText(
        `"${quote.quote}" — ${quote.author}\n\n${quoteUrl}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = `"${quote.quote}" — ${quote.author}\n\n${quoteUrl}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [quote]);

  const handleShare = useCallback(async () => {
    if (!quote) return;
    const quoteUrl = `https://cq-pwa.vercel.app/quote/${quote.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Christian Quote",
          text: `"${quote.quote}" — ${quote.author}`,
          url: quoteUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      void handleCopy();
    }
  }, [quote, handleCopy]);

  if (isSeeding) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-7.5rem)]">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-7.5rem)] gap-4 px-8 text-center">
        <p className="text-lg text-foreground/60">Quote not found</p>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-6 py-3 bg-primary rounded-xl text-white font-medium"
        >
          <ArrowLeft size={18} />
          Back to Home
        </button>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-7.5rem)]">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const topicColorMap = buildTopicColorMap(topics);
  const color = getQuoteColor(quote.topics, topicColorMap);
  const gradient = getQuoteGradient(quote.topics, topicColorMap);
  const textColor = getTextColor(color);

  const getQuoteFontSize = () => {
    const len = quote.quote.length;
    if (len > 400) return "text-sm";
    if (len > 250) return "text-base";
    if (len > 150) return "text-lg";
    return "text-xl";
  };

  return (
    <div className="h-[calc(100dvh-7.5rem)] p-4 flex flex-col gap-4">
      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors self-start"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Home</span>
      </button>

      {/* Quote card */}
      <div
        className="flex-1 rounded-3xl p-5 sm:p-8 flex flex-col justify-between shadow-2xl overflow-hidden"
        style={{
          background: gradient,
          color: textColor,
        }}
      >
        {/* Topic badges */}
        <div className="flex flex-wrap gap-2">
          {quote.topics.map((topic) => (
            <span
              key={topic}
              className="px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
              style={{
                backgroundColor:
                  textColor === "#ffffff"
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.1)",
              }}
            >
              {topic}
            </span>
          ))}
        </div>

        {/* Quote text */}
        <div className="flex-1 flex items-center justify-center py-4 sm:py-6">
          <blockquote
            className={`${getQuoteFontSize()} leading-relaxed text-center font-serif italic max-w-prose`}
          >
            &ldquo;{quote.quote}&rdquo;
          </blockquote>
        </div>

        {/* Author + Actions */}
        <div className="flex items-end justify-between">
          <p className="text-sm font-semibold opacity-80">— {quote.author}</p>
          <div className="flex gap-2">
            <button
              onClick={() => void handleCopy()}
              className="p-3 min-w-[44px] min-h-[44px] rounded-full backdrop-blur-sm transition-transform active:scale-90 flex items-center justify-center"
              style={{
                backgroundColor:
                  textColor === "#ffffff"
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.1)",
              }}
              aria-label="Copy quote"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
            <button
              onClick={() => void handleShare()}
              className="p-3 min-w-[44px] min-h-[44px] rounded-full backdrop-blur-sm transition-transform active:scale-90 flex items-center justify-center"
              style={{
                backgroundColor:
                  textColor === "#ffffff"
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.1)",
              }}
              aria-label="Share quote"
            >
              <Share2 size={18} />
            </button>
            <button
              className="p-3 min-w-[44px] min-h-[44px] rounded-full backdrop-blur-sm transition-transform active:scale-90 flex items-center justify-center"
              style={{
                backgroundColor:
                  textColor === "#ffffff"
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.1)",
              }}
              aria-label="Favorite quote"
            >
              <Heart size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
