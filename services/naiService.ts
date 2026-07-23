
import JSZip from 'jszip';
import type { NAIParams, ResolvedVibe } from '../types';
import { api } from './api';
import { buildGenerationPayload } from './naiPayload';

export const generateImage = async (
  apiKey: string,
  prompt: string,
  negative: string,
  params: NAIParams,
  vibes: ResolvedVibe[] = [],
) => {
  const payload = buildGenerationPayload(prompt, negative, params, vibes);
  const seed = payload.parameters.seed as number | undefined;

  // 调用 Worker Proxy, 传递 API Key Header
  const blob = await api.postBinary('/generate', payload, {
    'Authorization': `Bearer ${apiKey}`
  });

  // 解析 Zip (逻辑保持不变)
  const zip = await JSZip.loadAsync(blob);
  const filename = Object.keys(zip.files)[0];
  if (!filename) throw new Error("No image found in response");

  const fileData = await zip.files[filename].async('base64');

  // Extract seed from payload if available, or finding it in metadata would be ideal but for now we rely on what we sent
  // Actually, NAI returns the seed in the response JSON if we used the proper endpoint or read the png info.
  // The current implementation reads the ZIP. 
  // IMPORTANT: The backend usually returns a JSON with the seed if not successful, but for Zip response, the seed is often in the filename or we must trust what we sent.
  // HOWEVER, if we sent -1 (or undefined), the server picked one. The server response headers or a specific JSON file in the ZIP might have it.
  // NAI Zip often contains the image and sometimes a JSON metadata file.

  // Let's try to find a .json file in the zip
  let actualSeed = seed ?? 0;
  const jsonFile = Object.keys(zip.files).find(f => f.endsWith('.json'));
  if (jsonFile) {
    const jsonText = await zip.files[jsonFile].async('text');
    try {
      const json = JSON.parse(jsonText);
      /* 
         NAI JSON format usually usually has:
         { ... "seed": 123456 ... }
      */
      if (json.seed) actualSeed = json.seed;
    } catch (e) { console.error('Failed to parse metadata json', e); }
  } else {
    // Fallback: If we didn't send a seed, and can't find it, we might be out of luck without reading PNG chunks.
    // But typically NAI returns a JSON alongside the image in the zip.
  }

  return { image: `data:image/png;base64,${fileData}`, seed: actualSeed };
};
