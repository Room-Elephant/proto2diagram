// PlantUML encoding utility based on PlantUML documentation
// https://plantuml.com/code-javascript-synchronous
// Exact implementation from PlantUML official documentation

import pako from "pako";

// Global variables to match PlantUML documentation style
let r = "";
let i = 0;
let c1, c2, c3, c4;

function encode64(data) {
  r = "";
  for (i = 0; i < data.length; i += 3) {
    if (i + 2 == data.length) {
      r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
    } else if (i + 1 == data.length) {
      r += append3bytes(data.charCodeAt(i), 0, 0);
    } else {
      r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), data.charCodeAt(i + 2));
    }
  }
  return r;
}

function append3bytes(b1, b2, b3) {
  c1 = b1 >> 2;
  c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
  c4 = b3 & 0x3f;
  r = "";
  r += encode6bit(c1 & 0x3f);
  r += encode6bit(c2 & 0x3f);
  r += encode6bit(c3 & 0x3f);
  r += encode6bit(c4 & 0x3f);
  return r;
}

function encode6bit(b) {
  if (b < 10) {
    return String.fromCharCode(48 + b);
  }
  b -= 10;
  if (b < 26) {
    return String.fromCharCode(65 + b);
  }
  b -= 26;
  if (b < 26) {
    return String.fromCharCode(97 + b);
  }
  b -= 26;
  if (b == 0) {
    return "-";
  }
  if (b == 1) {
    return "_";
  }
  return "?";
}

/**
 * Convert text to HEX encoding as fallback (PlantUML HEX format)
 * @param {string} text - The UTF-8 encoded text
 * @returns {string} - The HEX encoded string
 */
function convertToHex(text) {
  let hex = "";
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    hex += charCode.toString(16).padStart(2, "0");
  }
  return hex;
}

/**
 * Compress and encode PlantUML diagram text for URL generation
 * This function follows the exact PlantUML documentation implementation
 * @param {string} plantumlText - The PlantUML diagram text
 * @returns {Object} - Object with encoded data and encoding type
 */
export function compressAndEncode(plantumlText) {
  // UTF8 encode - exactly as shown in PlantUML documentation
  const s = unescape(encodeURIComponent(plantumlText));

  // Use imported Pako library (modern and reliable)
  if (pako && pako.deflateRaw) {
    try {
      // Use pako.deflateRaw to get raw deflate data (no headers)
      // This should match gzdeflate() from PHP documentation
      const compressed = pako.deflateRaw(s, { level: 9 });
      // Convert Uint8Array to string
      const deflated = Array.from(compressed)
        .map((byte) => String.fromCharCode(byte))
        .join("");

      const encoded = encode64(deflated);

      return { data: encoded, type: "deflate" };
    } catch (error) {
      console.error("Pako compression failed:", error);
    }
  }

  // Fallback to original js-deflate functions if available
  if (typeof deflate !== "undefined") {
    return { data: encode64(deflate(s, 9)), type: "deflate" };
  } else if (typeof zip_deflate !== "undefined") {
    return { data: encode64(zip_deflate(s, 9)), type: "deflate" };
  }

  // Final fallback: use HEX encoding as per PlantUML documentation
  // This is simple and doesn't require compression
  console.warn("No compression library available - using HEX encoding fallback");
  return { data: convertToHex(s), type: "hex" };
}

/**
 * Generate PlantUML image URL
 * @param {string} plantumlText - The PlantUML diagram text
 * @param {string} baseUrl - The PlantUML server base URL
 * @returns {string} - The complete URL for the PlantUML image
 */
export function generatePlantUMLImageUrl(plantumlText, baseUrl) {
  const result = compressAndEncode(plantumlText);

  // Add appropriate prefix based on encoding type
  if (result.type === "hex") {
    return baseUrl + "~h" + result.data;
  } else {
    return baseUrl + result.data;
  }
}
