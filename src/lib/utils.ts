import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const AVATAR_COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
  '#ff5722', '#795548', '#607d8b'
];

/**
 * Generates a deterministic, two-tone gradient SVG avatar with the user's initials as a Base64 data URI.
 * Handles single-word, multi-word, and single-letter names.
 * @param name The user's name.
 * @returns A data URI string for the generated SVG avatar.
 */
export function generateInitialAvatar(name: string): string {
  const trimmedName = name.trim();
  if (!trimmedName) {
    name = '?';
  }

  const words = trimmedName.split(/\s+/).filter(Boolean);
  let initials = '';

  if (words.length >= 2) {
    // For multi-word names ("p smith" -> "PS")
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length > 1) {
    // For single-word names ("Peter" -> "Pe")
    initials = words[0][0].toUpperCase() + words[0][1].toLowerCase();
  } else if (words.length === 1 && words[0].length === 1) {
    // For single-letter names ("P" -> "P")
    initials = words[0][0].toUpperCase();
  } else {
    // Fallback for empty or invalid names
    initials = '?';
  }

  // Simple hash function to get a deterministic color from the palette
  let hash = 0;
  for (let i = 0; i < trimmedName.length; i++) {
    hash = trimmedName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex1 = Math.abs(hash % AVATAR_COLORS.length);
  const color1 = AVATAR_COLORS[colorIndex1];
  
  // Ensure the second color is different and complementary
  const colorIndex2 = (colorIndex1 + 5) % AVATAR_COLORS.length;
  const color2 = AVATAR_COLORS[colorIndex2];


  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#grad)" />
      <text
        x="50%"
        y="50%"
        dominant-baseline="central"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="40"
        font-weight="bold"
        fill="#ffffff"
      >
        ${initials}
      </text>
    </svg>
  `.replace(/\s\s+/g, ' '); // Minify SVG string

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
