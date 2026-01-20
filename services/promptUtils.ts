import { PromptChain } from '../types';

/**
 * Compiles the final prompt string by combining parts in a fixed order:
 * 1. Base Prompt
 * 2. Pre-Modules (isActive & position='pre')
 * 3. Subject/Variable Prompt (User Input)
 * 4. Post-Modules (isActive & position='post' or undefined)
 */
export const compilePrompt = (
  chain: Pick<PromptChain, 'basePrompt' | 'modules'>,
  subjectPrompt: string = '',
  activeModulesOnly: boolean = true
): string => {
  let promptParts: string[] = [];

  // 1. Add Base Prompt
  if (chain.basePrompt && chain.basePrompt.trim()) {
      promptParts.push(chain.basePrompt.trim());
  }

  // 2. Add Pre-Modules
  if (chain.modules) {
      const preModules = chain.modules.filter(m => {
          const isActive = !activeModulesOnly || m.isActive;
          return isActive && m.position === 'pre';
      });
      preModules.forEach(m => {
          if (m.content.trim()) promptParts.push(m.content.trim());
      });
  }

  // 3. Add Subject/Variable Prompt
  if (subjectPrompt && subjectPrompt.trim()) {
      promptParts.push(subjectPrompt.trim());
  }

  // 4. Add Post-Modules (Default to post if position is missing)
  if (chain.modules) {
      const postModules = chain.modules.filter(m => {
          const isActive = !activeModulesOnly || m.isActive;
          return isActive && (m.position === 'post' || !m.position);
      });
      postModules.forEach(m => {
          if (m.content.trim()) promptParts.push(m.content.trim());
      });
  }

  // 5. Join with commas and clean up
  // NAI generally prefers comma separation.
  // We join with ", " then clean up potential double commas.
  let fullPrompt = promptParts.join(', ');

  // Cleanup: remove double commas, leading/trailing commas/spaces
  fullPrompt = fullPrompt
      .replace(/,\s*,/g, ',')
      .replace(/^,\s*/, '')
      .replace(/,\s*$/, '');

  return fullPrompt;
};

/**
 * Legacy support: identify variables is no longer needed with the new structure.
 * Keeping an empty implementation or removing it would be fine, 
 * but removing it is cleaner as the UI logic has changed.
 */
