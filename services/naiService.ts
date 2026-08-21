
import JSZip from 'jszip';
import type { NAIParams, ResolvedVibe } from '../types';
import { api } from './api';
import { buildGenerationPayload } from './naiPayload';

const dataUriFromBase64 = (b64: string): string => {
  const trimmed = b64.replace(/\s/g, '');
  if (trimmed.startsWith('/9j/')) return `data:image/jpeg;base64,${trimmed}`;
  return `data:image/png;base64,${trimmed}`;
};

const unzipImage = async (blob: Blob, fallbackSeed: number) => {
  const zip = await JSZip.loadAsync(blob);
  const filename = Object.keys(zip.files)[0];
  if (!filename) throw new Error("No image found in response");

  const fileData = await zip.files[filename].async('base64');

  let actualSeed = fallbackSeed;
  const jsonFile = Object.keys(zip.files).find(f => f.endsWith('.json'));
  if (jsonFile) {
    const jsonText = await zip.files[jsonFile].async('text');
    try {
      const json = JSON.parse(jsonText);
      if (json.seed) actualSeed = json.seed;
    } catch (e) { console.error('Failed to parse metadata json', e); }
  }

  return { image: `data:image/png;base64,${fileData}`, seed: actualSeed };
};

export const generateImage = async (
  apiKey: string,
  prompt: string,
  negative: string,
  params: NAIParams,
  vibes: ResolvedVibe[] = [],
) => {
  const payload = buildGenerationPayload(prompt, negative, params, vibes);
  const seed = payload.parameters.seed as number | undefined;

  const blob = await api.postBinary('/generate', payload, {
    'Authorization': `Bearer ${apiKey}`
  });

  return unzipImage(blob, seed ?? 0);
};

export const generateImageStream = async (
  apiKey: string,
  prompt: string,
  negative: string,
  params: NAIParams,
  vibes: ResolvedVibe[] = [],
  onPreview?: (image: string, step?: number) => void,
) => {
  const payload = buildGenerationPayload(prompt, negative, { ...params, stream: true }, vibes);
  const fallbackSeed = payload.parameters.seed as number | undefined;
  let image = '';
  let seed = fallbackSeed ?? 0;

  await api.postSse(
    '/generate-stream',
    payload,
    { Authorization: `Bearer ${apiKey}` },
    (event, data) => {
      const b64 = typeof data.image === 'string' ? data.image : '';
      if (!b64) return;
      const uri = dataUriFromBase64(b64);
      if (event === 'intermediate') {
        onPreview?.(uri, typeof data.step_ix === 'number' ? data.step_ix : undefined);
        return;
      }
      if (event === 'final') {
        image = uri;
        if (typeof data.seed === 'number') seed = data.seed;
        onPreview?.(uri);
      }
      if (event === 'error') {
        throw new Error(typeof data.message === 'string' ? data.message : '流式生成失败');
      }
    },
  );

  if (!image) throw new Error('流式生成没有返回最终图片');
  return { image, seed };
};
