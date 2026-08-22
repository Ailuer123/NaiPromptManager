import { describe, expect, it } from 'vitest';
import { applyVersion, bump, parseLevel } from './bump-version.mjs';

describe('bump', () => {
  it('按级别进位', () => {
    expect(bump('1.2.0', 'patch')).toBe('1.2.1');
    expect(bump('1.2.3', 'minor')).toBe('1.3.0');
    expect(bump('1.2.3', 'major')).toBe('2.0.0');
  });
});

describe('parseLevel', () => {
  it('feat 升 minor，破坏性升 major，其余 patch', () => {
    expect(parseLevel('feat(nai): 加电量')).toBe('minor');
    expect(parseLevel('feat!: 换协议')).toBe('major');
    expect(parseLevel('fix(ui): 修按钮\n\nBREAKING CHANGE: 去掉旧接口')).toBe('major');
    expect(parseLevel('fix(auth): 修登录')).toBe('patch');
    expect(parseLevel('docs: 更新说明')).toBe('patch');
  });

  it('合并提交和空消息不升级', () => {
    expect(parseLevel('Merge branch main')).toBeNull();
    expect(parseLevel('# 只是注释\n')).toBeNull();
  });
});

describe('applyVersion', () => {
  it('同步 package.json、lock 与 APP_VERSION', () => {
    const out = applyVersion('1.3.0', {
      pkg: JSON.stringify({ name: 'x', version: '1.2.0' }, null, 2),
      lock: JSON.stringify({ version: '1.2.0', packages: { '': { version: '1.2.0' } } }, null, 2),
      ts: "export const APP_VERSION = '1.2.0';\n",
    });
    expect(JSON.parse(out.pkg).version).toBe('1.3.0');
    expect(JSON.parse(out.lock!).version).toBe('1.3.0');
    expect(JSON.parse(out.lock!).packages[''].version).toBe('1.3.0');
    expect(out.ts).toContain("export const APP_VERSION = '1.3.0'");
  });
});
