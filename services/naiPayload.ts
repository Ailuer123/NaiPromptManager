import type { NAIParams, ResolvedVibe } from '../types';
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
}

export interface NAIImageGenerationPayload {
  input: string;
  model: 'nai-diffusion-4-5-full';
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

  let finalPrompt = prompt;
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

  if (seed !== undefined) parameters.seed = seed;
  if (vibes.length > 0) {
    parameters.reference_image_multiple = vibes.map(vibe => vibe.encoding);
    parameters.reference_strength_multiple = vibes.map(vibe => vibe.strength);
    parameters.reference_information_extracted_multiple = vibes.map(vibe => vibe.informationExtracted);
  }

  return {
    input: finalPrompt,
    model: 'nai-diffusion-4-5-full',
    action: 'generate',
    parameters,
  };
};
