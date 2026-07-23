import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { VibePreset } from '../types';
import { VibeLibrary } from './vibeLibrary';

const makePreset = (id: string, createdAt: number): VibePreset => ({
  id,
  name: `Vibe ${id}`,
  encodings: [{ model: 'v4full', informationExtracted: 0.7, encoding: `ENCODED_${id}` }],
  defaultStrength: 0.6,
  defaultInformationExtracted: 0.7,
  createdAt,
  updatedAt: createdAt,
});

describe('VibeLibrary', () => {
  let library: VibeLibrary;

  beforeEach(() => {
    library = new VibeLibrary(`NAI_Vibe_Test_${crypto.randomUUID()}`);
  });

  it('写入并按创建时间倒序列出 Vibe', async () => {
    await library.put(makePreset('old', 10));
    await library.put(makePreset('new', 20));

    await expect(library.list()).resolves.toMatchObject([
      { id: 'new' },
      { id: 'old' },
    ]);
  });

  it('按 id 覆盖已有 Vibe 且可读取', async () => {
    await library.put(makePreset('same', 10));
    await library.put({ ...makePreset('same', 10), name: '更新后的名称', updatedAt: 30 });

    await expect(library.get('same')).resolves.toMatchObject({
      id: 'same',
      name: '更新后的名称',
      updatedAt: 30,
    });
    await expect(library.list()).resolves.toHaveLength(1);
  });

  it('删除指定 Vibe', async () => {
    await library.put(makePreset('delete-me', 10));

    await library.delete('delete-me');

    await expect(library.get('delete-me')).resolves.toBeUndefined();
  });

  it('清空本地库', async () => {
    await library.put(makePreset('one', 10));
    await library.put(makePreset('two', 20));

    await library.clear();

    await expect(library.list()).resolves.toEqual([]);
  });
});
