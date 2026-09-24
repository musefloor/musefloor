import { gardenArt } from "./garden-art.js";

export const postcardSize = Object.freeze({ width: 1200, height: 960 });

export function postcardSvg(plots) {
  // Only validated plant types and stages reach the shared illustration.
  const garden = gardenArt(Array.isArray(plots) ? plots : [])
    .replace('<svg ', '<svg x="60" y="154" width="1080" height="688.5" ')
    .replace('aria-label="A little garden of daisies, lavender, and mint in nine raised beds"', 'aria-label="Your nine garden plots"');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="960" viewBox="0 0 1200 960" role="img" aria-label="A postcard of your Pocket Garden">
    <rect width="1200" height="960" fill="#faf8ef"/>
    <text x="60" y="84" font-family="Georgia, serif" font-size="43" fill="#344737">My Pocket Garden</text>
    <text x="62" y="120" font-family="Arial, sans-serif" font-size="18" fill="#6d7965">A little patch of my own.</text>
    ${garden}
    <path d="M60 875H1140" stroke="#d4d9c8"/>
    <text x="60" y="915" font-family="Arial, sans-serif" font-size="18" fill="#4b3452">musefloor</text>
    <text x="1140" y="915" text-anchor="end" font-family="Arial, sans-serif" font-size="16" fill="#6d7965">musefloor.world</text>
  </svg>`;
}

export async function postcardPng(plots) {
  const source = new Blob([postcardSvg(plots)], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(source);
  try {
    const picture = new Image();
    const loaded = new Promise((resolve, reject) => {
      picture.onload = resolve;
      picture.onerror = () => reject(new Error("Postcard artwork could not be loaded."));
    });
    picture.src = url;
    await loaded;
    const canvas = document.createElement("canvas");
    canvas.width = postcardSize.width;
    canvas.height = postcardSize.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image export is unavailable.");
    context.drawImage(picture, 0, 0);
    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Postcard export failed.")), "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
