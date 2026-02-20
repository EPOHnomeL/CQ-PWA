import { Topic } from "./types";

// Mapping from topic name to a contrasting text color
function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function getTextColor(bgColor: string): string {
  try {
    const luminance = getLuminance(bgColor);
    return luminance > 0.4 ? "#1a1a2e" : "#ffffff";
  } catch {
    return "#ffffff";
  }
}

// Darken a hex color by a percentage (0-1)
export function darkenColor(hex: string, amount: number): string {
  try {
    const r = Math.max(
      0,
      Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)),
    );
    const g = Math.max(
      0,
      Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)),
    );
    const b = Math.max(
      0,
      Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)),
    );
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  } catch {
    return hex;
  }
}

// Default topic color for unmatched topics
export const DEFAULT_TOPIC_COLOR = "#6366f1";

// Build a topic color map for fast lookups
export function buildTopicColorMap(topics: Topic[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const t of topics) {
    map.set(t.topic.toLowerCase(), t.color);
  }
  return map;
}

// Get the primary color for a quote based on its first topic
export function getQuoteColor(
  quoteTopics: string[],
  topicColorMap: Map<string, string>,
): string {
  if (quoteTopics.length === 0) return DEFAULT_TOPIC_COLOR;
  const primary = quoteTopics[0].toLowerCase();
  return topicColorMap.get(primary) ?? DEFAULT_TOPIC_COLOR;
}

// Generate a CSS gradient from a quote's topic colors
export function getQuoteGradient(
  quoteTopics: string[],
  topicColorMap: Map<string, string>,
): string {
  if (quoteTopics.length === 0) {
    return `linear-gradient(135deg, ${DEFAULT_TOPIC_COLOR}, ${darkenColor(DEFAULT_TOPIC_COLOR, 0.45)})`;
  }

  const colors = quoteTopics
    .slice(0, 3)
    .map((t) => topicColorMap.get(t.toLowerCase()) ?? DEFAULT_TOPIC_COLOR);

  if (colors.length === 1) {
    return `linear-gradient(145deg, ${darkenColor(colors[0], 0.15)}, ${darkenColor(colors[0], 0.55)})`;
  }

  if (colors.length === 2) {
    return `linear-gradient(135deg, ${darkenColor(colors[0], 0.25)} 0%, ${darkenColor(colors[1], 0.4)} 100%)`;
  }

  return `linear-gradient(135deg, ${darkenColor(colors[0], 0.25)} 0%, ${darkenColor(colors[1], 0.3)} 50%, ${darkenColor(colors[2], 0.45)} 100%)`;
}
