import type { NAIParams, ResolvedVibe } from '../types';
import { isV5Model, resolveNaiModel, withTransparentTags } from './naiModels';
import { NAI_QUALITY_TAGS, NAI_UC_PRESETS } from './promptUtils';

interface NAICharCaption {
  char_caption: string;
  centers: Array<{ x: number; y: number }>;
}

export interface NAIImageGenerationParameters {
  params_version: number;
  width: number;
  height: number;
  scale: number;
  sampler: string;
  steps: number;
  n_samples: number;
  skip_cfg_above_sigma: number | null;
  cfg_rescale: number;
  qualityToggle: boolean;
  ucPreset: number;
  sm: boolean;
  sm_dyn: boolean;
  dynamic_thresholding: boolean;
  controlnet_strength: number;
  legacy: boolean;
  add_original_image: boolean;
  uncond_scale: number;
  noise_schedule: string;
  negative_prompt: string;
  seed?: number;
  v4_prompt: {
    caption: {
      base_caption: string;
      char_captions: NAICharCaption[];
    };
    use_coords: boolean;
    use_order: boolean;
  };
  v4_negative_prompt: {
    caption: {
      base_caption: string;
      char_captions: NAICharCaption[];
    };
    legacy_uc: boolean;
  };
  deliberate_euler_ancestral_bug: boolean;
  prefer_brownian: boolean;
  reference_image_multiple?: string[];
  reference_strength_multiple?: number[];
  reference_information_extracted_multiple?: number[];
  stream?: 'sse' | 'msgpack';
  straight_alpha?: boolean;
  tag_hint_transparent_background?: boolean;
}

export interface NAIImageGenerationPayload {
  input: string;
  model: string;
  action: 'generate';
  parameters: NAIImageGenerationParameters;
}

export const buildGenerationPayload = (
  prompt: string,
  negative: string,
  params: NAIParams,
  vibes: ResolvedVibe[] = [],
): NAIImageGenerationPayload => {
  const seed = params.seed !== undefined && params.seed !== null && params.seed !== -1
    ? params.seed
    : undefined;

  const model = resolveNaiModel(params);
  const useTransparent = isV5Model(params) && !!params.transparent;

  let finalPrompt = prompt;
  if (useTransparent) finalPrompt = withTransparentTags(finalPrompt);
  if (params.qualityToggle ?? true) {
    finalPrompt += NAI_QUALITY_TAGS;
  }

  let finalNegative = negative;
  const presetId = params.ucPreset ?? 0;
  if (presetId !== 4) {
    const presetString = NAI_UC_PRESETS[presetId as keyof typeof NAI_UC_PRESETS];
    if (presetString) finalNegative = presetString + finalNegative;
  }

  const characters = params.characters ?? [];
  const hasCharacters = characters.length > 0;
  const charCaptions = characters.map(character => ({
    char_caption: character.prompt,
    centers: [{ x: character.x, y: character.y }],
  }));
  const charNegativeCaptions = characters.map(character => ({
    char_caption: character.negativePrompt || '',
    centers: [{ x: character.x, y: character.y }],
  }));

  const parameters: NAIImageGenerationParameters = {
    params_version: 3,
    width: params.width,
    height: params.height,
    scale: params.scale,
    sampler: params.sampler,
    steps: params.steps,
    n_samples: 1,
    skip_cfg_above_sigma: params.variety ? 58 : null,
    cfg_rescale: params.cfgRescale ?? 0,
    qualityToggle: params.qualityToggle ?? true,
    ucPreset: params.ucPreset ?? 0,
    sm: false,
    sm_dyn: false,
    dynamic_thresholding: false,
    controlnet_strength: 1,
    legacy: false,
    add_original_image: true,
    uncond_scale: 1,
    noise_schedule: 'karras',
    negative_prompt: finalNegative,
    v4_prompt: {
      caption: {
        base_caption: finalPrompt,
        char_captions: charCaptions,
      },
      use_coords: params.useCoords ?? hasCharacters,
      use_order: true,
    },
    v4_negative_prompt: {
      caption: {
        base_caption: finalNegative,
        char_captions: charNegativeCaptions,
      },
      legacy_uc: false,
    },
    deliberate_euler_ancestral_bug: false,
    prefer_brownian: true,
  };

  if (params.stream) parameters.stream = 'sse';
  if (useTransparent) {
    parameters.tag_hint_transparent_background = true;
    parameters.straight_alpha = params.alphaMode !== 'premultiplied';
  }

  if (seed !== undefined) parameters.seed = seed;
  if (vibes.length > 0) {
    parameters.reference_image_multiple = vibes.map(vibe => vibe.encoding);
    parameters.reference_strength_multiple = vibes.map(vibe => vibe.strength);
    parameters.reference_information_extracted_multiple = vibes.map(vibe => vibe.informationExtracted);
  }

  return {
    input: finalPrompt,
    model,
    action: 'generate',
    parameters,
  };
};
