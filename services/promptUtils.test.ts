import { describe, expect, it } from 'vitest';
import type { PromptModule } from '../types';
import { compilePrompt, compilePromptSegments } from './promptUtils';

type ChainPick = {
  basePrompt: string;
  modules: PromptModule[];
};

const mod = (overrides: Partial<PromptModule> & Pick<PromptModule, 'id' | 'content'>): PromptModule => ({
  name: overrides.id,
  isActive: true,
  ...overrides,
});

/** Frozen replica of the pre-segments compilePrompt. Tests must stay byte-identical. */
const legacyCompilePrompt = (
  chain: Pick<ChainPick, 'basePrompt' | 'modules'>,
  subjectPrompt: string = '',
  activeModulesOnly: boolean = true,
): string => {
  const promptParts: string[] = [];

  if (chain.basePrompt && chain.basePrompt.trim()) {
    promptParts.push(chain.basePrompt.trim());
  }

  if (chain.modules) {
    const preModules = chain.modules.filter((m) => {
      const isActive = !activeModulesOnly || m.isActive;
      return isActive && m.position === 'pre';
    });
    preModules.forEach((m) => {
      if (m.content.trim()) promptParts.push(m.content.trim());
    });
  }

  if (subjectPrompt && subjectPrompt.trim()) {
    promptParts.push(subjectPrompt.trim());
  }

  if (chain.modules) {
    const postModules = chain.modules.filter((m) => {
      const isActive = !activeModulesOnly || m.isActive;
      return isActive && (m.position === 'post' || !m.position);
    });
    postModules.forEach((m) => {
      if (m.content.trim()) promptParts.push(m.content.trim());
    });
  }

  let fullPrompt = promptParts.join(', ');
  fullPrompt = fullPrompt
    .replace(/,\s*,/g, ',')
    .replace(/^,\s*/, '')
    .replace(/,\s*$/, '');

  return fullPrompt;
};

const joinSegments = (segs: ReturnType<typeof compilePromptSegments>): string => {
  return [segs.base, segs.pre, segs.subject, segs.post]
    .filter((part) => part && part.trim())
    .join(', ')
    .replace(/,\s*,/g, ',')
    .replace(/^,\s*/, '')
    .replace(/,\s*$/, '');
};

const fixtures: Array<{
  name: string;
  chain: ChainPick;
  subject: string;
  activeModulesOnly?: boolean;
}> = [
  {
    name: 'base + pre + subject + post',
    chain: {
      basePrompt: 'masterpiece, best quality',
      modules: [
        mod({ id: 'pre-1', content: 'soft lighting, muted palette', position: 'pre' }),
        mod({ id: 'post-1', content: 'artist:wlop, film grain', position: 'post' }),
      ],
    },
    subject: '1girl, looking at viewer',
  },
  {
    name: 'empty base',
    chain: {
      basePrompt: '',
      modules: [
        mod({ id: 'pre-1', content: 'soft lighting', position: 'pre' }),
        mod({ id: 'post-1', content: 'artist:wlop', position: 'post' }),
      ],
    },
    subject: '1girl',
  },
  {
    name: 'inactive modules excluded when activeModulesOnly',
    chain: {
      basePrompt: 'masterpiece',
      modules: [
        mod({ id: 'pre-on', content: 'soft lighting', position: 'pre', isActive: true }),
        mod({ id: 'pre-off', content: 'harsh flash', position: 'pre', isActive: false }),
        mod({ id: 'post-on', content: 'artist:wlop', position: 'post', isActive: true }),
        mod({ id: 'post-off', content: 'artist:artgerm', position: 'post', isActive: false }),
      ],
    },
    subject: '1girl',
    activeModulesOnly: true,
  },
  {
    name: 'missing position treated as post',
    chain: {
      basePrompt: 'masterpiece',
      modules: [
        mod({ id: 'pre-1', content: 'soft lighting', position: 'pre' }),
        mod({ id: 'legacy', content: 'film grain' }),
      ],
    },
    subject: '1girl',
  },
  {
    name: 'double-comma cleanup',
    chain: {
      basePrompt: 'masterpiece,, best quality, ',
      modules: [
        mod({ id: 'pre-1', content: ', soft lighting, , muted', position: 'pre' }),
        mod({ id: 'post-1', content: 'artist:wlop,,', position: 'post' }),
      ],
    },
    subject: ', 1girl, ',
  },
  {
    name: 'whitespace-only parts are dropped',
    chain: {
      basePrompt: '   ',
      modules: [
        mod({ id: 'pre-empty', content: '   ', position: 'pre' }),
        mod({ id: 'post-1', content: 'artist:wlop', position: 'post' }),
      ],
    },
    subject: '  ',
  },
  {
    name: 'activeModulesOnly=false includes inactive',
    chain: {
      basePrompt: 'masterpiece',
      modules: [
        mod({ id: 'pre-off', content: 'harsh flash', position: 'pre', isActive: false }),
        mod({ id: 'post-off', content: 'artist:artgerm', position: 'post', isActive: false }),
      ],
    },
    subject: '1girl',
    activeModulesOnly: false,
  },
];

describe('compilePromptSegments', () => {
  it('returns { base, pre, subject, post }', () => {
    const segs = compilePromptSegments(
      {
        basePrompt: 'masterpiece',
        modules: [
          mod({ id: 'pre-1', content: 'soft lighting', position: 'pre' }),
          mod({ id: 'post-1', content: 'artist:wlop', position: 'post' }),
        ],
      },
      '1girl',
    );
    expect(segs).toEqual({
      base: 'masterpiece',
      pre: 'soft lighting',
      subject: '1girl',
      post: 'artist:wlop',
    });
  });

  it('joins multiple modules inside pre / post', () => {
    const segs = compilePromptSegments(
      {
        basePrompt: 'base',
        modules: [
          mod({ id: 'pre-1', content: 'a', position: 'pre' }),
          mod({ id: 'pre-2', content: 'b', position: 'pre' }),
          mod({ id: 'post-1', content: 'c', position: 'post' }),
          mod({ id: 'post-2', content: 'd', position: 'post' }),
        ],
      },
      's',
    );
    expect(segs.pre).toBe('a, b');
    expect(segs.post).toBe('c, d');
  });
});

describe('compilePrompt golden (byte-identical to legacy)', () => {
  it.each(fixtures)('$name', ({ chain, subject, activeModulesOnly }) => {
    const actual = compilePrompt(chain, subject, activeModulesOnly);
    const golden = legacyCompilePrompt(chain, subject, activeModulesOnly);
    expect(actual).toBe(golden);
    expect(joinSegments(compilePromptSegments(chain, subject, activeModulesOnly))).toBe(golden);
  });

  it('compilePrompt is the join of compilePromptSegments (cannot drift)', () => {
    for (const { chain, subject, activeModulesOnly } of fixtures) {
      const compiled = compilePrompt(chain, subject, activeModulesOnly);
      const joined = joinSegments(compilePromptSegments(chain, subject, activeModulesOnly));
      expect(compiled).toBe(joined);
    }
  });
});
