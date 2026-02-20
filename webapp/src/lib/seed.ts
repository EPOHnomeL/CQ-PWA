// Mulberry32 seeded PRNG — deterministic pseudo-random number generator
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Get a daily seed based on current UTC date
// Everyone in the world gets the same seed for a given calendar day
export function getDailySeed(): number {
  const now = new Date();
  const dateStr = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  return parseInt(dateStr, 10);
}

// Generate a deterministic shuffled sequence of indices
// Uses Fisher-Yates shuffle with the seeded PRNG
export function getSeededIndices(totalCount: number, seed: number): number[] {
  const rng = mulberry32(seed);
  const indices = Array.from({ length: totalCount }, (_, i) => i);

  // Fisher-Yates shuffle with seeded random
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices;
}

// Get a batch of seeded quote offsets for a given page
// page starts at 0, each page returns batchSize offsets
export function getSeededBatch(
  totalCount: number,
  seed: number,
  page: number,
  batchSize: number,
): number[] {
  const allIndices = getSeededIndices(totalCount, seed);
  const start = page * batchSize;
  return allIndices.slice(start, start + batchSize);
}
