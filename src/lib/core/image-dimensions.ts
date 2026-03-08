/**
 * Extract width/height from image binary headers.
 * Pure ArrayBuffer parsing — no native deps, works in CF Workers.
 * Supports JPEG, PNG, WebP, GIF.
 */

interface Dimensions {
  width: number;
  height: number;
}

export function getImageDimensions(buffer: ArrayBuffer): Dimensions | null {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 24) return null;

  if (isPNG(bytes)) return parsePNG(bytes);
  if (isJPEG(bytes)) return parseJPEG(bytes);
  if (isWebP(bytes)) return parseWebP(bytes);
  if (isGIF(bytes)) return parseGIF(bytes);

  return null;
}

function isPNG(b: Uint8Array): boolean {
  return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
}

function isJPEG(b: Uint8Array): boolean {
  return b[0] === 0xFF && b[1] === 0xD8;
}

function isWebP(b: Uint8Array): boolean {
  return b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
    && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
}

function isGIF(b: Uint8Array): boolean {
  return b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46;
}

function parsePNG(b: Uint8Array): Dimensions | null {
  // IHDR chunk starts at offset 8 (length) + 4 (type) = 16 for width
  if (b.length < 24) return null;
  const width = (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19];
  const height = (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23];
  return width > 0 && height > 0 ? { width, height } : null;
}

function parseJPEG(b: Uint8Array): Dimensions | null {
  let offset = 2;
  while (offset < b.length - 9) {
    if (b[offset] !== 0xFF) return null;
    const marker = b[offset + 1];
    // SOF markers: C0-C3, C5-C7, C9-CB, CD-CF
    if (
      (marker >= 0xC0 && marker <= 0xC3) ||
      (marker >= 0xC5 && marker <= 0xC7) ||
      (marker >= 0xC9 && marker <= 0xCB) ||
      (marker >= 0xCD && marker <= 0xCF)
    ) {
      const height = (b[offset + 5] << 8) | b[offset + 6];
      const width = (b[offset + 7] << 8) | b[offset + 8];
      return width > 0 && height > 0 ? { width, height } : null;
    }
    // Skip segment
    const segLen = (b[offset + 2] << 8) | b[offset + 3];
    offset += 2 + segLen;
  }
  return null;
}

function parseWebP(b: Uint8Array): Dimensions | null {
  if (b.length < 30) return null;
  const chunk = String.fromCharCode(b[12], b[13], b[14], b[15]);

  if (chunk === 'VP8 ' && b.length >= 30) {
    // Lossy: width at 26-27, height at 28-29 (little-endian, 14 bits)
    const width = ((b[27] << 8) | b[26]) & 0x3FFF;
    const height = ((b[29] << 8) | b[28]) & 0x3FFF;
    return width > 0 && height > 0 ? { width, height } : null;
  }

  if (chunk === 'VP8L' && b.length >= 25) {
    // Lossless: bit-packed at offset 21
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    const width = (bits & 0x3FFF) + 1;
    const height = ((bits >> 14) & 0x3FFF) + 1;
    return width > 0 && height > 0 ? { width, height } : null;
  }

  if (chunk === 'VP8X' && b.length >= 30) {
    // Extended: canvas size at 24-26 (width) and 27-29 (height), LE 24-bit + 1
    const width = (b[24] | (b[25] << 8) | (b[26] << 16)) + 1;
    const height = (b[27] | (b[28] << 8) | (b[29] << 16)) + 1;
    return width > 0 && height > 0 ? { width, height } : null;
  }

  return null;
}

function parseGIF(b: Uint8Array): Dimensions | null {
  if (b.length < 10) return null;
  const width = b[6] | (b[7] << 8);
  const height = b[8] | (b[9] << 8);
  return width > 0 && height > 0 ? { width, height } : null;
}
