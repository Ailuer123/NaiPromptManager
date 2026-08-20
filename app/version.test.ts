import { describe, expect, it } from 'vitest';
import { APP_REPO_URL, repoDisplayName } from './version';

describe('repoDisplayName', () => {
  it('取仓库名', () => {
    expect(repoDisplayName(APP_REPO_URL)).toBe('NaiPromptManager');
    expect(repoDisplayName('https://github.com/DEEIX-AI/DEEIX-Chat/')).toBe('DEEIX-Chat');
  });
});
