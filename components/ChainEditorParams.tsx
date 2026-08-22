import React, { useEffect } from 'react';
import { NAIParams } from '../types';
import { isV5Model, NAI_MODEL_OPTIONS } from '../services/naiModels';
import { Chip, Collapse, Field, HelpTip, Input, Select } from './ui';

interface ChainEditorParamsProps {
    params: NAIParams;
    setParams: (p: NAIParams) => void;
    canEdit: boolean;
    markChange: () => void;
    notify?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
    compositionExtra?: React.ReactNode;
    compositionBody?: React.ReactNode;
    compositionOpen?: boolean;
    onCompositionOpenChange?: (open: boolean) => void;
}

const RESOLUTIONS = {
    Portrait: { width: 832, height: 1216, label: '832×1216' },
    Landscape: { width: 1216, height: 832, label: '1216×832' },
    Square: { width: 1024, height: 1024, label: '1024×1024' },
};

export const ChainEditorParams: React.FC<ChainEditorParamsProps> = ({
    params,
    setParams,
    canEdit,
    markChange,
    notify,
    compositionExtra,
    compositionBody,
    compositionOpen,
    onCompositionOpenChange,
}) => {
    const handleResolutionChange = (mode: string) => {
        if (!canEdit && mode !== 'Custom') return;
        if (canEdit && mode !== 'Custom') {
            const res = RESOLUTIONS[mode as keyof typeof RESOLUTIONS];
            setParams({ ...params, width: res.width, height: res.height });
            markChange();
        }
    };

    const getCurrentResolutionMode = () => {
        const w = params.width;
        const h = params.height;
        if (w === 832 && h === 1216) return 'Portrait';
        if (w === 1216 && h === 832) return 'Landscape';
        if (w === 1024 && h === 1024) return 'Square';
        return 'Custom';
    };

    const mode = getCurrentResolutionMode();
    useEffect(() => {
        if (mode === 'Custom' && canEdit) handleResolutionChange('Portrait');
        // snap leftover custom sizes to a preset
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const patch = (next: Partial<NAIParams>) => {
        if (!canEdit) return;
        setParams({ ...params, ...next });
        markChange();
    };

    return (
        <>
            <Collapse
                title="多角色"
                open={compositionOpen}
                defaultOpen
                onOpenChange={onCompositionOpenChange}
                extra={compositionExtra}
            >
                {compositionBody}
            </Collapse>

            <Collapse title="参数配置" defaultOpen>
                <div className="stack">
                    <div className="param-grid param-pair">
                        <div className="param-group">
                            <p className="param-group-label">模型</p>
                            <div className="chips">
                                {NAI_MODEL_OPTIONS.map((opt) => (
                                    <Chip
                                        key={opt.id}
                                        active={isV5Model(params) ? opt.id === 'nai-diffusion-5-full' : opt.id === 'nai-diffusion-4-5-full'}
                                        disabled={!canEdit}
                                        onClick={() => patch({
                                            model: opt.id,
                                            ...(opt.id !== 'nai-diffusion-5-full' ? { transparent: false } : {}),
                                        })}
                                    >
                                        {opt.label}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                        <div className="param-group">
                            <div className="param-group-label">
                                透明背景
                                <HelpTip label="透明模式说明">
                                    <span><strong>Straight（直通）</strong>：颜色和透明分开存。半透明的头发还是头发本身的颜色，叠在任何底上都正常。网页、Photoshop、本站预览用这个。</span>
                                    <span><strong>Premultiplied（预乘）</strong>：颜色已经按透明度压暗过。半透明处会发暗。游戏引擎、视频合成常用。用错会出现黑边或亮边。</span>
                                </HelpTip>
                            </div>
                            <div className="chips">
                                <Chip
                                    active={!!params.transparent && isV5Model(params)}
                                    disabled={!canEdit}
                                    className={!isV5Model(params) ? 'chip-locked' : undefined}
                                    title={isV5Model(params) ? 'V5 透明背景' : '仅 V5 支持透明背景'}
                                    onClick={() => {
                                        if (!canEdit) return;
                                        if (!isV5Model(params)) {
                                            notify?.('透明背景仅 V5 支持，请先切换模型', 'warning');
                                            return;
                                        }
                                        patch({ transparent: !params.transparent });
                                    }}
                                >
                                    透明
                                </Chip>
                                {isV5Model(params) && params.transparent ? (
                                    <>
                                        <Chip
                                            active={(params.alphaMode ?? 'straight') === 'straight'}
                                            disabled={!canEdit}
                                            onClick={() => patch({ alphaMode: 'straight' })}
                                        >
                                            Straight
                                        </Chip>
                                        <Chip
                                            active={params.alphaMode === 'premultiplied'}
                                            disabled={!canEdit}
                                            onClick={() => patch({ alphaMode: 'premultiplied' })}
                                        >
                                            Premultiplied
                                        </Chip>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>
                    <div className="param-group">
                        <p className="param-group-label">构图</p>
                        <div className="chips">
                            {Object.entries(RESOLUTIONS).map(([key, val]) => (
                                <Chip key={key} active={mode === key || (mode === 'Custom' && key === 'Portrait')} disabled={!canEdit} onClick={() => handleResolutionChange(key)}>
                                    {val.label}
                                </Chip>
                            ))}
                        </div>
                    </div>
                    <div className="param-group">
                        <div className="param-grid">
                            <Field label="步数">
                                <Input
                                    type="number"
                                    disabled={!canEdit}
                                    max={28}
                                    value={params.steps}
                                    onChange={(e) => patch({ steps: Math.min(28, parseInt(e.target.value) || 0) })}
                                />
                            </Field>
                            <Field label="采样器">
                                <Select
                                    disabled={!canEdit}
                                    value={params.sampler || 'k_euler_ancestral'}
                                    onChange={(e) => patch({ sampler: e.target.value })}
                                >
                                    <option value="k_euler_ancestral">k_euler_ancestral</option>
                                    <option value="k_euler">k_euler</option>
                                    <option value="k_dpmpp_2s_ancestral">k_dpmpp_2s_ancestral</option>
                                    <option value="k_dpmpp_2m_sde">k_dpmpp_2m_sde</option>
                                    <option value="k_dpmpp_2m">k_dpmpp_2m</option>
                                    <option value="k_dpmpp_sde">k_dpmpp_sde</option>
                                </Select>
                            </Field>
                            <Field label="CFG Scale">
                                <Input
                                    type="number"
                                    step="0.1"
                                    disabled={!canEdit}
                                    value={params.scale}
                                    onChange={(e) => patch({ scale: parseFloat(e.target.value) })}
                                />
                            </Field>
                            <Field label="CFG Rescale">
                                <Input
                                    type="number"
                                    min={0}
                                    max={1}
                                    step="0.05"
                                    disabled={!canEdit}
                                    value={params.cfgRescale ?? 0}
                                    onChange={(e) => patch({ cfgRescale: parseFloat(e.target.value) })}
                                />
                            </Field>
                            <Field label="种子">
                                <Input
                                    type="number"
                                    disabled={!canEdit}
                                    placeholder="随机"
                                    value={params.seed === undefined || params.seed === null ? '' : params.seed}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        patch({ seed: val === '' ? undefined : parseInt(val) });
                                    }}
                                />
                            </Field>
                            <Field label="UC Preset">
                                <Select
                                    disabled={!canEdit}
                                    value={params.ucPreset ?? 0}
                                    onChange={(e) => patch({ ucPreset: parseInt(e.target.value) })}
                                >
                                    <option value={0}>Heavy</option>
                                    <option value={1}>Light</option>
                                    <option value={2}>Furry</option>
                                    <option value={3}>Human Focus</option>
                                    <option value={4}>None</option>
                                </Select>
                            </Field>
                        </div>
                    </div>
                    <div className="chips">
                        <Chip active={params.qualityToggle ?? true} disabled={!canEdit} onClick={() => patch({ qualityToggle: !(params.qualityToggle ?? true) })}>
                            画质增强
                        </Chip>
                        <Chip active={!!params.variety} disabled={!canEdit} onClick={() => patch({ variety: !params.variety })}>
                            多样性
                        </Chip>
                    </div>
                </div>
            </Collapse>
        </>
    );
};
