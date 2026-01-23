
import JSZip from 'jszip';
import { NAIParams } from '../types';
import { api } from './api';

export const generateImage = async (apiKey: string, prompt: string, negative: string, params: NAIParams) => {
  // Logic update: If seed is 0 or undefined, pass 0 to API (Random). 
  // If user explicitly sets a seed (other than 0), use it.
  // Note: NAI API treats 0 as "random seed" usually, so we pass it as explicit 0 or strict random integer.
  const seed = (params.seed === undefined || params.seed === null) ? 0 : params.seed;

  // Prepare Character Captions for V4.5
  const hasCharacters = params.characters && params.characters.length > 0;
  const charCaptions = hasCharacters ? params.characters!.map(c => ({
      char_caption: c.prompt,
      centers: [ { x: c.x, y: c.y } ]
  })) : [];

  const payload = {
    input: prompt, // Keep flat input as fallback or for summary
    model: "nai-diffusion-4-5-full",
    action: "generate",
    parameters: {
      params_version: 3,
      width: params.width,
      height: params.height,
      scale: params.scale,
      sampler: params.sampler,
      steps: params.steps,
      n_samples: 1,
      
      // V4.5 Specifics
      qualityToggle: params.qualityToggle ?? true, // Default to true
      ucPreset: params.ucPreset ?? 0, // Default to 0 (Heavy)
      
      // Legacy / Standard params
      sm: false,
      sm_dyn: false,
      dynamic_thresholding: false,
      controlnet_strength: 1,
      legacy: false,
      add_original_image: true,
      uncond_scale: 1,
      cfg_rescale: 0,
      noise_schedule: "karras",
      negative_prompt: negative,
      seed: seed,
      
      v4_prompt: {
        caption: {
          base_caption: prompt, // The compiled global prompt
          char_captions: charCaptions
        },
        use_coords: hasCharacters, // Only enable coords if we have characters
        use_order: true
      },
      v4_negative_prompt: {
        caption: {
          base_caption: negative,
          char_captions: []
        },
        legacy_uc: false
      },
      
      deliberate_euler_ancestral_bug: false,
      prefer_brownian: true
    }
  };

  // 调用 Worker Proxy, 传递 API Key Header
  const blob = await api.postBinary('/generate', payload, {
      'Authorization': `Bearer ${apiKey}`
  });

  // 解析 Zip (逻辑保持不变)
  const zip = await JSZip.loadAsync(blob);
  const filename = Object.keys(zip.files)[0];
  if (!filename) throw new Error("No image found in response");
  
  const fileData = await zip.files[filename].async('base64');
  return `data:image/png;base64,${fileData}`;
};
