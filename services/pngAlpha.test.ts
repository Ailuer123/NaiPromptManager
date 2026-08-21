import { describe, expect, it } from 'vitest';
import { dataUriHasAlpha, pngBytesHaveAlpha } from './pngAlpha';

function pngHeader(colorType: number): Uint8Array {
  const bytes = new Uint8Array(26);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  bytes[25] = colorType;
  return bytes;
}

describe('pngAlpha', () => {
  it('识别 RGBA / gray+alpha，RGB 不算透明', () => {
    expect(pngBytesHaveAlpha(pngHeader(6))).toBe(true);
    expect(pngBytesHaveAlpha(pngHeader(4))).toBe(true);
    expect(pngBytesHaveAlpha(pngHeader(2))).toBe(false);
  });

  it('从 PNG data URI 读 IHDR color type', () => {
    const bytes = pngHeader(6);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    const uri = `data:image/png;base64,${btoa(binary)}`;
    expect(dataUriHasAlpha(uri)).toBe(true);
    expect(dataUriHasAlpha('data:image/jpeg;base64,xxxx')).toBe(false);
  });
});
