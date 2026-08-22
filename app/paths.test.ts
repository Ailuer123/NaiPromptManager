import { describe, expect, it } from 'vitest';
import { editPath, parseAppPath, pathFor } from './paths';

describe('parseAppPath / pathFor', () => {
  it('往返映射各主页面', () => {
    const views = ['list', 'characters', 'library', 'inspiration', 'history', 'playground', 'admin'] as const;
    for (const view of views) {
      expect(parseAppPath(pathFor(view)).view).toBe(view);
    }
  });

  it('编辑页带上串 id', () => {
    expect(pathFor('edit', 'abc')).toBe('/chains/abc');
    expect(parseAppPath('/chains/abc')).toEqual({ view: 'edit', id: 'abc' });
    expect(parseAppPath(editPath('x y'))).toEqual({ view: 'edit', id: 'x y' });
  });

  it('未知路径回到看板', () => {
    expect(parseAppPath('/nope')).toEqual({ view: 'list' });
  });
});
