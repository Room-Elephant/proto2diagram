// PlantUML encoding utility based on PlantUML documentation
// https://plantuml.com/code-javascript-synchronous
// NOTE: Output may differ from PlantUML's due to compression library differences.
// PlantUML accepts any correctly DEFLATE-compressed and encoded input.

import pako from "pako";

export function encode(pumlText: string): string {
  function encode64(data: string): string {
    let result = "";
    for (let i = 0; i < data.length; i += 3) {
      if (i + 2 == data.length) {
        result += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
      } else if (i + 1 == data.length) {
        result += append3bytes(data.charCodeAt(i), 0, 0);
      } else {
        result += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), data.charCodeAt(i + 2));
      }
    }
    return result;
  }

  function append3bytes(b1: number, b2: number, b3: number): string {
    let c1 = b1 >> 2;
    let c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
    let c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
    let c4 = b3 & 0x3f;
    let result = "";
    result += encode6bit(c1 & 0x3f);
    result += encode6bit(c2 & 0x3f);
    result += encode6bit(c3 & 0x3f);
    result += encode6bit(c4 & 0x3f);
    return result;
  }

  function encode6bit(b: number): string {
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

  function compressAndEncode(pumlText: string): string {
    const escaped = new TextEncoder().encode(pumlText);

    try {
      const compressed = pako.deflateRaw(escaped, { level: 9 });
      const deflated = Array.from(compressed)
        .map((byte) => String.fromCharCode(byte))
        .join("");

      const encoded = encode64(deflated);

      return encoded;
    } catch (error) {
      throw new Error(`Pako compression failed: " ${error}`);
    }
  }

  return compressAndEncode(pumlText);
}
