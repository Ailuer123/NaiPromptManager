/** PNG IHDR color type 4 = gray+alpha, 6 = RGBA。 */
export function pngBytesHaveAlpha(bytes: Uint8Array): boolean {
  if (bytes.length < 26) return false;
  if (bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) return false;
  const colorType = bytes[25];
  return colorType === 4 || colorType === 6;
}

export function dataUriHasAlpha(dataUri: string): boolean {
  if (!dataUri.startsWith('data:image/png')) return false;
  const comma = dataUri.indexOf(',');
  if (comma < 0) return false;
  const b64 = dataUri.slice(comma + 1, comma + 1 + 48);
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return pngBytesHaveAlpha(bytes);
  } catch {
    return false;
  }
}
