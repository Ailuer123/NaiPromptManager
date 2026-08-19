import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { NAIParams, VibeMount, VibePreset } from '../types';
import { parseVibeFile } from '../services/vibeParse';
import { vibeLibrary, VibeLibrary } from '../services/vibeLibrary';
import { IconWarn } from './ui/glyphs';
import { Portal } from './ui/Portal';
import {
  clampMountStrength,
  getMaxStrengthForMount,
  getVibeStrengthTotal,
  isVibeGroup,
  isVibeStrengthOverRecommended,
  MAX_MOUNTED_VIBES,
  tryAppendVibeMount,
  validateVibeMounts,
} from '../services/vibeResolve';

interface ChainEditorVibePanelProps {
  params: NAIParams;
  setParams: (params: NAIParams) => void;
  canEdit: boolean;
  markChange: () => void;
  notify: (message: string, type?: 'success' | 'error') => void;
  library?: VibeLibrary;
}

const formatValue = (value: number): string => value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');

export const ChainEditorVibePanel: React.FC<ChainEditorVibePanelProps> = ({
  params,
  setParams,
  canEdit,
  markChange,
  notify,
  library = vibeLibrary,
}) => {
  const [presets, setPresets] = useState<VibePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mounts = params.vibes ?? [];

  const refreshLibrary = async () => {
    try {
      setPresets(await library.list());
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '读取 Vibe 本地库失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshLibrary();
  }, [library]);

  useEffect(() => {
    if (!showLibrary) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowLibrary(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [showLibrary]);

  const presetsById = useMemo(
    () => new Map(presets.map(preset => [preset.id, preset])),
    [presets],
  );
  const validationError = validateVibeMounts(mounts);
  const strengthTotal = getVibeStrengthTotal(mounts);
  const strengthOverRecommended = isVibeStrengthOverRecommended(mounts);
  const filteredPresets = presets.filter(preset => (
    preset.name.toLowerCase().includes(search.trim().toLowerCase())
  ));

  const updateMounts = (nextMounts: VibeMount[]) => {
    setParams({ ...params, vibes: nextMounts });
    markChange();
  };

  const mountPreset = (preset: VibePreset) => {
    const result = tryAppendVibeMount(mounts, preset);
    if ('error' in result) {
      notify(result.error, 'error');
      return;
    }
    updateMounts(result.mounts);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    if (files.length === 0) return;

    setImporting(true);
    try {
      const imported = (await Promise.all(files.map(file => parseVibeFile(file)))).flat();
      for (const preset of imported) await library.put(preset);
      await refreshLibrary();

      let nextMounts = mounts;
      let mountedCount = 0;
      for (const preset of imported) {
        if (nextMounts.some(mount => mount.vibeId === preset.id)) continue;
        if (nextMounts.length >= MAX_MOUNTED_VIBES) break;
        const result = tryAppendVibeMount(nextMounts, preset);
        if ('error' in result) break;
        nextMounts = result.mounts;
        mountedCount += 1;
      }
      if (mountedCount > 0) updateMounts(nextMounts);

      const group = imported.find(preset => isVibeGroup(preset));
      if (imported.length === 1 && group) {
        notify(`已导入 Vibe 组「${group.name}」（${group.members?.length ?? 0} 个）`);
      } else {
        notify(`已导入 ${imported.length} 个 Vibe`);
      }
      if (mountedCount < imported.length) {
        notify(`挂载上限为 ${MAX_MOUNTED_VIBES}，其余 Vibe 已保存到本地库`);
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : '导入 Vibe 失败', 'error');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateMount = (index: number, patch: Partial<VibeMount>) => {
    updateMounts(mounts.map((mount, mountIndex) => {
      if (mountIndex !== index) return mount;
      const next = { ...mount, ...patch };
      if (patch.strength !== undefined) {
        next.strength = clampMountStrength(mounts, index, patch.strength);
      }
      return next;
    }));
  };

  const deletePreset = async (preset: VibePreset) => {
    if (!confirm(`确定从本地库删除「${preset.name}」吗？`)) return;
    try {
      await library.delete(preset.id);
      updateMounts(mounts.filter(mount => mount.vibeId !== preset.id));
      await refreshLibrary();
      notify(`已删除 Vibe「${preset.name}」`);
    } catch (error) {
      notify(error instanceof Error ? error.message : '删除 Vibe 失败', 'error');
    }
  };

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Vibe 参考</h3>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              已挂载 {mounts.length}/{MAX_MOUNTED_VIBES}
            </span>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              id="vibe-file-input"
              type="file"
              multiple
              accept=".naiv4vibe,.naiv4vibebundle,application/json"
              onChange={handleImport}
              className="sr-only"
            />
            <label
              htmlFor="vibe-file-input"
              aria-label="导入 Vibe 文件"
              className={`cursor-pointer rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-purple-500 ${importing ? 'pointer-events-none opacity-60' : ''}`}
            >
              {importing ? '导入中…' : '导入文件'}
            </label>
            <button
              type="button"
              onClick={() => setShowLibrary(true)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
            >
              本地库
            </button>
          </div>
        )}
      </div>

      {loadError && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {loadError}
        </div>
      )}

      {mounts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-4 py-7 text-center dark:border-gray-600">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">尚未使用 Vibe</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mounts.map((mount, index) => {
            const preset = presetsById.get(mount.vibeId);
            const missing = !loading && !preset;
            const grouped = isVibeGroup(preset);
            const maxStrength = getMaxStrengthForMount(mounts, index);
            const informationLevels = [...new Set(
              preset?.encodings.map(encoding => encoding.informationExtracted) ?? [],
            )].sort((left, right) => left - right);

            return (
              <div key={`${mount.vibeId}-${index}`} className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                {preset?.thumbnailUrl ? (
                  <img src={preset.thumbnailUrl} alt="" className="h-14 w-14 flex-none rounded-md bg-gray-200 object-cover dark:bg-gray-700" />
                ) : (
                  <div className="flex h-14 w-14 flex-none items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-bold text-white">
                    {mount.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{mount.name}</p>
                      {grouped && <p className="text-[11px] text-indigo-600 dark:text-indigo-300">组 · {preset?.members?.length} 个，按组调用</p>}
                      {missing && <p className="text-[11px] text-red-500">本地库中已不存在，请重新导入</p>}
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        aria-label={`移除${mount.name}`}
                        onClick={() => updateMounts(mounts.filter((_, mountIndex) => mountIndex !== index))}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem]">
                    <label className="block text-[11px] text-gray-500 dark:text-gray-400">
                      <span className="mb-1 flex justify-between"><span>Strength</span><strong>{formatValue(mount.strength)}</strong></span>
                      <input
                        aria-label={`${mount.name} Strength`}
                        type="range"
                        min="0"
                        max={maxStrength}
                        step="0.05"
                        value={Math.min(mount.strength, maxStrength)}
                        disabled={!canEdit || missing}
                        onChange={event => updateMount(index, { strength: Number(event.target.value) })}
                        className="h-1.5 w-full cursor-pointer accent-indigo-600 disabled:cursor-not-allowed"
                      />
                    </label>
                    <label className="block text-[11px] text-gray-500 dark:text-gray-400">
                      <span className="mb-1 block">Information Extracted</span>
                      {grouped ? (
                        <p className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500 dark:border-gray-600 dark:bg-gray-800">组内各自档位</p>
                      ) : (
                        <select
                          aria-label={`${mount.name} Information Extracted`}
                          value={mount.informationExtracted}
                          disabled={!canEdit || missing || informationLevels.length === 0}
                          onChange={event => updateMount(index, { informationExtracted: Number(event.target.value) })}
                          className="w-full rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        >
                          {informationLevels.length === 0 && <option value={mount.informationExtracted}>{formatValue(mount.informationExtracted)}</option>}
                          {informationLevels.map(level => <option key={level} value={level}>{formatValue(level)}</option>)}
                        </select>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={`mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-xs ${validationError || strengthOverRecommended ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-900/60 dark:text-gray-400'}`}>
        <span>
          {validationError
            ? <span className="inline-ico"><IconWarn />{validationError}</span>
            : strengthOverRecommended
              ? <span className="inline-ico"><IconWarn />Strength 合计建议不超过 1（当前已超出，仍可保存与生成）</span>
              : 'Strength 合计建议不超过 1'}
        </span>
        <strong>{strengthTotal.toFixed(2)} / 1.00</strong>
      </div>

      {showLibrary && (
        <Portal>
        <div className="modal-layer vibe-lib-layer" onClick={() => setShowLibrary(false)}>
          <div className="modal-card vibe-lib-card surface-strong" onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="vibe-lib-title">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <div>
                <h3 id="vibe-lib-title" className="font-bold text-gray-900 dark:text-white">Vibe 本地库</h3>
              </div>
              <button type="button" aria-label="关闭 Vibe 本地库" onClick={() => setShowLibrary(false)} className="rounded p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">×</button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="搜索 Vibe 名称"
                className="mb-4 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <div className="min-h-0 flex-1 overflow-y-auto">
                {filteredPresets.length === 0 ? (
                  <p className="py-12 text-center text-sm text-gray-400">{loading ? '正在读取…' : '本地库中没有 Vibe'}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {filteredPresets.map(preset => {
                      const mounted = mounts.some(mount => mount.vibeId === preset.id);
                      const appendResult = tryAppendVibeMount(mounts, preset);
                      const canMount = !mounted && !('error' in appendResult);
                      return (
                        <div key={preset.id} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                          {preset.thumbnailUrl ? (
                            <img src={preset.thumbnailUrl} alt="" className="aspect-square w-full object-cover" />
                          ) : (
                            <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-600 text-3xl font-bold text-white">{preset.name.slice(0, 1).toUpperCase()}</div>
                          )}
                          {mounted && <span className="absolute right-1 top-1 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] text-white">已挂载</span>}
                          {isVibeGroup(preset) && <span className="absolute left-1 top-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white">组 · {preset.members?.length}</span>}
                          <div className="p-2">
                            <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">{preset.name}</p>
                            <div className="mt-2 flex gap-1">
                              <button type="button" disabled={!canMount} onClick={() => mountPreset(preset)} className="flex-1 rounded bg-indigo-600 px-2 py-1 text-[11px] text-white disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700">{mounted ? '已挂载' : '挂载'}</button>
                              <button
                                type="button"
                                aria-label={`删除${preset.name}`}
                                title="从本地库删除"
                                onClick={() => void deletePreset(preset)}
                                className="rounded border border-gray-300 p-1.5 text-gray-500 hover:border-red-400 hover:text-red-500 dark:border-gray-600"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </section>
  );
};
