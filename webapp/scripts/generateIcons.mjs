#!/usr/bin/env node
/**
 * Generate all icon sizes from the logo SVG
 * Run: node scripts/generateIcons.mjs
 */

import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const publicDir = join(rootDir, "public");
const appDir = join(rootDir, "src", "app");

// Brand colors
const PRIMARY_COLOR = "#6366f1";
const BACKGROUND_COLOR = "#1a1a2e";

// Ensure directories exist
const iconsDir = join(publicDir, "icons");
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Read the logo SVG
const logoSvg = readFileSync(join(iconsDir, "logo.svg"), "utf-8");

// Helper to create a centered logo with background
async function createIcon(size, options = {}) {
  const {
    padding = 0.15,
    background = BACKGROUND_COLOR,
    logoColor = PRIMARY_COLOR,
  } = options;

  // Calculate logo size with padding (ensure integer)
  const paddingAmount = Math.floor(size * padding);
  const maxLogoSize = size - paddingAmount * 2;

  // Logo aspect ratio is 102.85:130 (width:height)
  // Calculate dimensions to fit within maxLogoSize
  const logoAspect = 102.85 / 130; // ~0.79
  let logoWidth, logoHeight;

  if (maxLogoSize * logoAspect <= maxLogoSize) {
    // Height constrained
    logoHeight = maxLogoSize;
    logoWidth = Math.floor(maxLogoSize * logoAspect);
  } else {
    // Width constrained
    logoWidth = maxLogoSize;
    logoHeight = Math.floor(maxLogoSize / logoAspect);
  }

  // Ensure minimum size
  logoWidth = Math.max(16, logoWidth);
  logoHeight = Math.max(16, logoHeight);

  // Modify SVG to use the specified color
  const coloredSvg = logoSvg.replace(/fill="#6366f1"/g, `fill="${logoColor}"`);

  // Create a composite image with background
  const svgBuffer = Buffer.from(coloredSvg);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([
      {
        input: await sharp(svgBuffer)
          .resize(logoWidth, logoHeight, { fit: "contain" })
          .toBuffer(),
        gravity: "center",
      },
    ])
    .png();
}

// Generate favicon.ico (multi-resolution ICO)
async function generateFavicon() {
  console.log("Generating favicon.ico...");

  // Generate 16x16, 32x32, 48x48 PNGs
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(
    sizes.map((size) =>
      createIcon(size, { padding: 0.1 }).then((s) => s.toBuffer()),
    ),
  );

  // For simplicity, we'll use the 32x32 PNG as favicon
  // Next.js can also use icon.png instead of favicon.ico
  await createIcon(32, { padding: 0.1 }).then((s) =>
    s.toFile(join(appDir, "favicon.ico")),
  );

  console.log("  ✓ favicon.ico");
}

// Generate Next.js icon files
async function generateNextIcons() {
  console.log("Generating Next.js icons...");

  // icon.png (512x512) - Next.js 13+ convention
  await createIcon(512, { padding: 0.15 }).then((s) =>
    s.toFile(join(appDir, "icon.png")),
  );
  console.log("  ✓ icon.png (512x512)");

  // apple-icon.png (180x180)
  await createIcon(180, { padding: 0.1, background: BACKGROUND_COLOR }).then(
    (s) => s.toFile(join(appDir, "apple-icon.png")),
  );
  console.log("  ✓ apple-icon.png (180x180)");
}

// Generate PWA manifest icons
async function generatePWAIcons() {
  console.log("Generating PWA icons...");

  // icon-192.png
  await createIcon(192, { padding: 0.15 }).then((s) =>
    s.toFile(join(iconsDir, "icon-192.png")),
  );
  console.log("  ✓ icon-192.png");

  // icon-512.png
  await createIcon(512, { padding: 0.15 }).then((s) =>
    s.toFile(join(iconsDir, "icon-512.png")),
  );
  console.log("  ✓ icon-512.png");
}

// Generate social sharing images (OG/Twitter)
async function generateSocialImages() {
  console.log("Generating social sharing images...");

  const width = 1200;
  const height = 630;
  const logoHeight = 280;

  // Logo aspect ratio is 102.85:130
  const logoAspect = 102.85 / 130;
  const logoWidth = Math.floor(logoHeight * logoAspect);

  // Resize logo for the composite
  const logoBuffer = await sharp(
    Buffer.from(logoSvg.replace(/fill="#6366f1"/g, `fill="${PRIMARY_COLOR}"`)),
  )
    .resize(logoWidth, logoHeight, { fit: "contain" })
    .toBuffer();

  // Calculate position (centered horizontally, slightly above center vertically)
  const left = Math.floor((width - logoWidth) / 2);
  const top = Math.floor((height - logoHeight) / 2 - 60);

  // Create OG image
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BACKGROUND_COLOR,
    },
  })
    .composite([
      {
        input: logoBuffer,
        left,
        top,
      },
    ])
    .png()
    .toFile(join(appDir, "opengraph-image.png"));
  console.log("  ✓ opengraph-image.png (1200x630)");

  // Twitter image (same dimensions)
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BACKGROUND_COLOR,
    },
  })
    .composite([
      {
        input: logoBuffer,
        left,
        top,
      },
    ])
    .png()
    .toFile(join(appDir, "twitter-image.png"));
  console.log("  ✓ twitter-image.png (1200x630)");
}

// Main execution
async function main() {
  console.log("🎨 Generating icons for Christian Quotes app...\n");

  try {
    await generateFavicon();
    await generateNextIcons();
    await generatePWAIcons();
    await generateSocialImages();

    console.log("\n✅ All icons generated successfully!");
  } catch (error) {
    console.error("Error generating icons:", error);
    process.exit(1);
  }
}

main();
