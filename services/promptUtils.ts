
import { PromptChain } from '../types';

/**
 * NAI V4 Specific String Constants
 */
export const NAI_QUALITY_TAGS = ', very aesthetic, masterpiece, no text';

// Map ID to String. Order matches UI options: 0:Heavy, 1:Light, 2:Furry, 3:Human
export const NAI_UC_PRESETS = {
    0: 'nsfw, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, ',
    1: 'nsfw, lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page, ',
    2: 'nsfw, {worst quality}, distracting watermark, unfinished, bad quality, {widescreen}, upscale, {sequence}, {{grandfathered content}}, blurred foreground, chromatic aberration, sketch, everyone, [sketch background], simple, [flat colors], ych (character), outline, multiple scenes, [[horror (theme)]], comic, ',
    3: 'nsfw, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, @_@, mismatched pupils, glowing eyes, bad anatomy, '
};

export type CompiledPromptSegments = {
  base: string;
  pre: string;
  subject: string;
  post: string;
};

const joinParts = (parts: Array<string | undefined | null>): string =>
  parts
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(', ');

const cleanupCommas = (prompt: string): string =>
  prompt
    .replace(/,\s*,/g, ',')
    .replace(/^,\s*/, '')
    .replace(/,\s*$/, '');

/**
 * Splits the compile pipeline into labeled segments.
 * Order is Base → Pre-Modules → Subject → Post-Modules (missing position = post).
 */
export const compilePromptSegments = (
  chain: Pick<PromptChain, 'basePrompt' | 'modules'>,
  subjectPrompt: string = '',
  activeModulesOnly: boolean = true
): CompiledPromptSegments => {
  const modules = chain.modules ?? [];
  const keep = (active: boolean) => !activeModulesOnly || active;

  return {
    base: (chain.basePrompt ?? '').trim(),
    pre: joinParts(
      modules
        .filter((m) => keep(m.isActive) && m.position === 'pre')
        .map((m) => m.content)
    ),
    subject: (subjectPrompt ?? '').trim(),
    post: joinParts(
      modules
        .filter((m) => keep(m.isActive) && (m.position === 'post' || !m.position))
        .map((m) => m.content)
    ),
  };
};

/**
 * Compiles the final prompt string by combining parts in a fixed order:
 * 1. Base Prompt
 * 2. Pre-Modules (isActive & position='pre')
 * 3. Subject/Variable Prompt (User Input)
 * 4. Post-Modules (isActive & position='post' or undefined)
 *
 * Implemented as the join of compilePromptSegments so the two cannot drift.
 */
export const compilePrompt = (
  chain: Pick<PromptChain, 'basePrompt' | 'modules'>,
  subjectPrompt: string = '',
  activeModulesOnly: boolean = true
): string => {
  const segs = compilePromptSegments(chain, subjectPrompt, activeModulesOnly);
  return cleanupCommas(joinParts([segs.base, segs.pre, segs.subject, segs.post]));
};
