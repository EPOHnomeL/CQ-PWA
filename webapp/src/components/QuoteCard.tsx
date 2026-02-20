"use client";

import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Heart, Share2, Copy, Check } from "lucide-react";
import type { Quote } from "@/lib/types";
import { getTextColor } from "@/lib/colors";
import { useAuthGuard } from "@/hooks/useAuthGuard";

interface QuoteCardProps {
  quote: Quote;
  color: string;
  gradient: string;
  onSwipe: (direction: "left" | "right") => void;
  onFavorite?: (quote: Quote) => void;
  isFavorited?: boolean;
  isFront?: boolean;
}

export function QuoteCard({
  quote,
  color,
  gradient,
  onSwipe,
  onFavorite,
  isFavorited = false,
  isFront = false,
}: QuoteCardProps) {
  const [copied, setCopied] = useState(false);
  const textColor = getTextColor(color);
  const { requireAuth } = useAuthGuard();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const opacity = useTransform(
    x,
    [-300, -100, 0, 100, 300],
    [0.5, 1, 1, 1, 0.5],
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const threshold = 100;
      if (info.offset.x > threshold) {
        onSwipe("right");
      } else if (info.offset.x < -threshold) {
        onSwipe("left");
      }
    },
    [onSwipe],
  );

  const doCopy = useCallback(async () => {
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

  const handleCopy = useCallback(() => {
    requireAuth(() => void doCopy());
  }, [requireAuth, doCopy]);

  const doShare = useCallback(async () => {
    const quoteUrl = `https://cq-pwa.vercel.app/quote/${quote.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Christian Quote",
          text: `"${quote.quote}" — ${quote.author}`,
          url: quoteUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      void doCopy();
    }
  }, [quote, doCopy]);

  const handleShare = useCallback(() => {
    requireAuth(() => void doShare());
  }, [requireAuth, doShare]);

  const handleFavorite = useCallback(() => {
    if (!onFavorite) return;
    requireAuth(() => onFavorite(quote));
  }, [requireAuth, onFavorite, quote]);

  // Determine font size based on quote length
  const getQuoteFontSize = () => {
    const len = quote.quote.length;
    if (len > 400) return "text-sm";
    if (len > 250) return "text-base";
    if (len > 150) return "text-lg";
    return "text-xl";
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={isFront ? {} : { scale: 0.95, y: 10 }}
      exit={{ x: 500, opacity: 0, transition: { duration: 0.3 } }}
    >
      <div
        className="w-full h-full rounded-3xl p-5 sm:p-8 flex flex-col justify-between shadow-2xl overflow-hidden"
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
              onClick={handleCopy}
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
              onClick={handleShare}
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

            {onFavorite && (
              <button
                onClick={handleFavorite}
                className="p-3 min-w-[44px] min-h-[44px] rounded-full backdrop-blur-sm transition-transform active:scale-90 flex items-center justify-center"
                style={{
                  backgroundColor:
                    textColor === "#ffffff"
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.1)",
                }}
                aria-label={
                  isFavorited ? "Remove from favorites" : "Add to favorites"
                }
              >
                <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
