"use client";

import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Heart, Share2, Copy, Check } from "lucide-react";
import type { Quote } from "@/lib/types";
import { getTextColor } from "@/lib/colors";

interface QuoteCardProps {
  quote: Quote;
  color: string;
  onSwipe: (direction: "left" | "right") => void;
  onFavorite?: (quote: Quote) => void;
  isFront?: boolean;
}

export function QuoteCard({
  quote,
  color,
  onSwipe,
  onFavorite,
  isFront = false,
}: QuoteCardProps) {
  const [copied, setCopied] = useState(false);
  const textColor = getTextColor(color);
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

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`"${quote.quote}" — ${quote.author}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = `"${quote.quote}" — ${quote.author}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [quote]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Christian Quote",
          text: `"${quote.quote}" — ${quote.author}`,
        });
      } catch {
        // User cancelled share
      }
    } else {
      void handleCopy();
    }
  }, [quote, handleCopy]);

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
        className="w-full h-full rounded-3xl p-6 flex flex-col justify-between shadow-2xl"
        style={{
          backgroundColor: color,
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
        <div className="flex-1 flex items-center justify-center py-6">
          <blockquote
            className={`${getQuoteFontSize()} leading-relaxed text-center font-serif italic`}
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
              className="p-2.5 rounded-full backdrop-blur-sm transition-transform active:scale-90"
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
              className="p-2.5 rounded-full backdrop-blur-sm transition-transform active:scale-90"
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
                onClick={() => onFavorite(quote)}
                className="p-2.5 rounded-full backdrop-blur-sm transition-transform active:scale-90"
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
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
