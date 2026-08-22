import type { VibeEncoding, VibePreset } from '../types';

const VIBE_IDENTIFIER = 'novelai-vibe-transfer';
const VIBE_EXTENSIONS = /\.naiv4vibe(?:bundle)?$/i;
/** 单文件最大 8MB（base64 编码后体积更大，先挡异常大文件）。 */
export const MAX_VIBE_FILE_BYTES = 8 * 1024 * 1024;
/** 缩略图 data URI / base64 最大字符数。 */
export const MAX_VIBE_THUMBNAIL_CHARS = 500_000;
/** 单次导入最多条目。 */
export const MAX_VIBE_IMPORT_COUNT = 50;

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const asFiniteNumber = (value: unknown): number | undefined => (
  typeof value === 'number' && Number.isFinite(value) ? value : undefined
);

const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));

const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `vibe-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const parseComment = (value: unknown): UnknownRecord => {
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const toImageDataUri = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  if (value.length > MAX_VIBE_THUMBNAIL_CHARS) return undefined;
  if (value.startsWith('data:')) return value;
  const mimeType = value.startsWith('/9j/')
    ? 'image/jpeg'
    : value.startsWith('UklGR')
      ? 'image/webp'
      : 'image/png';
  const dataUri = `data:${mimeType};base64,${value}`;
  return dataUri.length > MAX_VIBE_THUMBNAIL_CHARS ? undefined : dataUri;
};

const collectEncodings = (value: unknown): VibeEncoding[] => {
  if (!isRecord(value)) return [];

  const unique = new Map<string, VibeEncoding>();
  for (const [model, variants] of Object.entries(value)) {
    if (!isRecord(variants)) continue;

    for (const variant of Object.values(variants)) {
      if (!isRecord(variant) || typeof variant.encoding !== 'string' || variant.encoding.length === 0) continue;
      if (!isRecord(variant.params)) continue;

      const informationExtracted = asFiniteNumber(variant.params.information_extracted);
      if (informationExtracted === undefined) continue;

      const encoding: VibeEncoding = {
        model,
        informationExtracted: clampUnit(informationExtracted),
        encoding: variant.encoding,
      };
      unique.set(`${model}:${encoding.informationExtracted}`, encoding);
    }
  }

  return [...unique.values()].sort((left, right) => (
    left.model.localeCompare(right.model)
    || left.informationExtracted - right.informationExtracted
  ));
};

const parseOneVibe = (
  value: unknown,
  sourceFilename: string,
  displayName: string,
): VibePreset => {
  if (!isRecord(value) || value.identifier !== VIBE_IDENTIFIER) {
    throw new Error('不是受支持的 NovelAI Vibe 文件');
  }

  const encodings = collectEncodings(value.encodings);
  if (encodings.length === 0) {
    throw new Error('Vibe 文件中没有可用的预编码 Vibe');
  }

  const comment = parseComment(value.comment);
  const importInfo = isRecord(value.importInfo) ? value.importInfo : {};
  const requestedInformation = asFiniteNumber(comment.information_extracted)
    ?? asFiniteNumber(importInfo.information_extracted);
  const importedModel = typeof importInfo.model === 'string' ? importInfo.model.toLowerCase() : '';
  const preferredEncodingModel = importedModel.includes('full')
    ? 'v4full'
    : importedModel.includes('curated')
      ? 'v4curated'
      : undefined;
  const preferredEncodings = preferredEncodingModel
    ? encodings.filter(encoding => encoding.model.toLowerCase() === preferredEncodingModel)
    : encodings;
  const defaultPool = preferredEncodings.length > 0 ? preferredEncodings : encodings;
  const defaultEncoding = requestedInformation === undefined
    ? defaultPool[0]
    : defaultPool.reduce((best, candidate) => (
      Math.abs(candidate.informationExtracted - requestedInformation)
        < Math.abs(best.informationExtracted - requestedInformation)
        ? candidate
        : best
    ));
  const requestedStrength = asFiniteNumber(comment.strength)
    ?? asFiniteNumber(importInfo.strength)
    ?? 0.6;
  const now = Date.now();

  return {
    id: typeof value.id === 'string' && value.id.length > 0 ? value.id : createId(),
    name: displayName,
    thumbnailUrl: toImageDataUri(value.thumbnail) ?? toImageDataUri(value.image),
    encodings,
    defaultStrength: clampUnit(requestedStrength),
    defaultInformationExtracted: defaultEncoding.informationExtracted,
    sourceFilename,
    createdAt: asFiniteNumber(value.createdAt) ?? now,
    updatedAt: now,
  };
};

export const parseVibeFileContent = (content: string, filename: string): VibePreset[] => {
  if (content.length > MAX_VIBE_FILE_BYTES) {
    throw new Error(`Vibe 文件过大，请控制在 ${Math.floor(MAX_VIBE_FILE_BYTES / (1024 * 1024))}MB 以内`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('无法解析 Vibe 文件，请确认文件没有损坏');
  }

  const baseName = filename.replace(VIBE_EXTENSIONS, '') || '未命名 Vibe';
  if (isRecord(parsed) && Array.isArray(parsed.vibes)) {
    if (parsed.vibes.length === 0) {
      throw new Error('Vibe 文件中没有可用的预编码 Vibe');
    }
    if (parsed.vibes.length > MAX_VIBE_IMPORT_COUNT) {
      throw new Error(`单个 bundle 最多包含 ${MAX_VIBE_IMPORT_COUNT} 个 Vibe`);
    }
    return parsed.vibes.map((item, index) => (
      parseOneVibe(item, filename, `${baseName} ${index + 1}`)
    ));
  }

  return [parseOneVibe(parsed, filename, baseName)];
};

export const parseVibeFile = async (file: File): Promise<VibePreset[]> => {
  if (file.size > MAX_VIBE_FILE_BYTES) {
    throw new Error(`Vibe 文件过大，请控制在 ${Math.floor(MAX_VIBE_FILE_BYTES / (1024 * 1024))}MB 以内`);
  }
  return parseVibeFileContent(await file.text(), file.name);
};
