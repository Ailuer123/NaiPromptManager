import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKG_PATH = path.join(ROOT, 'package.json');
const LOCK_PATH = path.join(ROOT, 'package-lock.json');
const VERSION_TS = path.join(ROOT, 'app', 'version.ts');

export function bump(version, level) {
  const parts = version.split('.').map((n) => Number(n));
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) {
    throw new Error(`无效版本号: ${version}`);
  }
  let [major, minor, patch] = parts;
  if (level === 'major') return `${major + 1}.0.0`;
  if (level === 'minor') return `${major}.${minor + 1}.0`;
  if (level === 'patch') return `${major}.${minor}.${patch + 1}`;
  throw new Error(`无效升级级别: ${level}`);
}

export function parseLevel(message) {
  const text = String(message || '')
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .join('\n')
    .trim();
  if (!text || /^Merge\s/i.test(text)) return null;
  if (/^BREAKING CHANGE:/m.test(text) || /^[a-z]+(?:\([^)]+\))?!:/i.test(text)) return 'major';
  const type = text.match(/^([a-z]+)(?:\([^)]+\))?:/i)?.[1]?.toLowerCase();
  if (type === 'feat') return 'minor';
  return 'patch';
}

export function readPackageVersion(pkgJson = fs.readFileSync(PKG_PATH, 'utf8')) {
  return JSON.parse(pkgJson).version;
}

export function applyVersion(next, files = {
  pkg: fs.readFileSync(PKG_PATH, 'utf8'),
  lock: fs.existsSync(LOCK_PATH) ? fs.readFileSync(LOCK_PATH, 'utf8') : null,
  ts: fs.readFileSync(VERSION_TS, 'utf8'),
}) {
  const pkg = JSON.parse(files.pkg);
  pkg.version = next;
  const nextPkg = `${JSON.stringify(pkg, null, 2)}\n`;

  let nextLock = files.lock;
  if (nextLock) {
    const lock = JSON.parse(nextLock);
    lock.version = next;
    if (lock.packages?.['']) lock.packages[''].version = next;
    nextLock = `${JSON.stringify(lock, null, 2)}\n`;
  }

  if (!/export const APP_VERSION = '[^']+'/.test(files.ts)) {
    throw new Error('app/version.ts 缺少 APP_VERSION');
  }
  const nextTs = files.ts.replace(
    /export const APP_VERSION = '[^']+'/,
    `export const APP_VERSION = '${next}'`,
  );

  return { pkg: nextPkg, lock: nextLock, ts: nextTs };
}

function headPackageVersion() {
  try {
    return JSON.parse(execSync('git show HEAD:package.json', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })).version;
  } catch {
    return null;
  }
}

function gitAdd(paths) {
  execSync(`git add -- ${paths.join(' ')}`, { cwd: ROOT, stdio: 'inherit' });
}

export function run(argv = process.argv.slice(2)) {
  if (process.env.SKIP_VERSION_BUMP) {
    console.log('SKIP_VERSION_BUMP: 跳过版本升级');
    return null;
  }

  const fromMsgIdx = argv.indexOf('--from-msg');
  const setIdx = argv.indexOf('--set');
  const levelIdx = argv.indexOf('--level');
  const gitAddFlag = argv.includes('--git-add');

  const current = readPackageVersion();
  let next = current;

  if (setIdx !== -1) {
    next = argv[setIdx + 1];
    if (!/^\d+\.\d+\.\d+$/.test(next)) throw new Error(`无效 --set: ${next}`);
  } else if (fromMsgIdx !== -1) {
    const head = headPackageVersion();
    if (head && current !== head) {
      console.log(`版本已是 ${current}（HEAD ${head}），跳过自动升级`);
      return current;
    }
    const msgFile = argv[fromMsgIdx + 1];
    const message = fs.readFileSync(msgFile, 'utf8');
    const level = parseLevel(message);
    if (!level) {
      console.log('无约定式提交标题，跳过版本升级');
      return current;
    }
    next = bump(current, level);
  } else {
    const level = argv[levelIdx + 1] || argv.find((a) => ['major', 'minor', 'patch'].includes(a));
    if (!level) throw new Error('用法: bump-version.mjs --level patch|minor|major | --from-msg <file> | --set x.y.z');
    next = bump(current, level);
  }

  if (next === current) {
    console.log(`版本未变化: ${current}`);
    return current;
  }

  const written = applyVersion(next);
  fs.writeFileSync(PKG_PATH, written.pkg);
  fs.writeFileSync(VERSION_TS, written.ts);
  if (written.lock) fs.writeFileSync(LOCK_PATH, written.lock);
  if (gitAddFlag) {
    gitAdd(['package.json', 'app/version.ts', ...(written.lock ? ['package-lock.json'] : [])]);
  }
  console.log(`${current} → ${next}`);
  return next;
}

const isMain = process.argv[1] && path.normalize(fileURLToPath(import.meta.url)) === path.normalize(path.resolve(process.argv[1]));
if (isMain) run();
