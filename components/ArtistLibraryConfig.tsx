
import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Field, Input, Textarea } from './ui/Field';
import { Sheet } from './ui/Sheet';
import { Tag } from './ui/Tag';

interface BenchmarkSlot {
    label: string;
    prompt: string;
}

interface BenchmarkConfig {
    slots: BenchmarkSlot[];
    negative: string;
    seed: number;
    steps: number;
    scale: number;
    interval?: number;
}

interface ArtistLibraryConfigProps {
    show: boolean;
    onClose: () => void;
    onSave: (config: BenchmarkConfig) => void;
    initialConfig: BenchmarkConfig;
    notify: (msg: string, type?: 'success' | 'error') => void;
}

export const ArtistLibraryConfig: React.FC<ArtistLibraryConfigProps> = ({
    show, onClose, onSave, initialConfig
}) => {
    const [draftConfig, setDraftConfig] = useState<BenchmarkConfig>(initialConfig);
    const [slotToDelete, setSlotToDelete] = useState<number | null>(null);

    useEffect(() => {
        if (show) {
            setDraftConfig(JSON.parse(JSON.stringify(initialConfig)));
            setSlotToDelete(null);
        }
    }, [show, initialConfig]);

    const updateSlot = (index: number, field: keyof BenchmarkSlot, value: string) => {
        const newSlots = [...draftConfig.slots];
        newSlots[index] = { ...newSlots[index], [field]: value };
        setDraftConfig({ ...draftConfig, slots: newSlots });
    };

    const addSlot = () => {
        setDraftConfig({
            ...draftConfig,
            slots: [...draftConfig.slots, { label: `分组 ${draftConfig.slots.length + 1}`, prompt: "" }]
        });
    };

    const handleDeleteClick = (index: number) => {
        setSlotToDelete(index);
    };

    const confirmDeleteSlot = () => {
        if (slotToDelete === null) return;
        const newSlots = draftConfig.slots.filter((_, i) => i !== slotToDelete);
        setDraftConfig({ ...draftConfig, slots: newSlots });
        setSlotToDelete(null);
    };

    const handleSave = () => {
        onSave(draftConfig);
    };

    return (
        <Sheet open={show} onClose={onClose} title="实装测试配置">
            <div className="pref-row" style={{ marginBottom: 8 }}>
                <p className="hint" style={{ margin: 0, fontSize: 12.5, color: 'var(--mute)' }}>
                    配置生成实装图时的参数。系统会自动添加 <code>artist:NAME</code>。
                </p>
                <Tag tone="mist">编辑模式</Tag>
            </div>

            {slotToDelete !== null && (
                <div className="notice danger" style={{ marginBottom: 12 }}>
                    <h4>确认删除此分组？</h4>
                    <p>
                        删除第 {slotToDelete + 1} 组 ({draftConfig.slots[slotToDelete]?.label}) 会导致后续分组序号前移，可能会使已生成的实装图错位。
                    </p>
                    <div className="sheet-foot">
                        <Button variant="ghost" size="sm" onClick={() => setSlotToDelete(null)}>取消</Button>
                        <Button variant="danger" size="sm" onClick={confirmDeleteSlot}>确认删除</Button>
                    </div>
                </div>
            )}

            <div className="create-form">
                <div className="pref-row">
                    <span className="copy-section"><h4>测试分组 (Slots)</h4></span>
                    <Button variant="ghost" size="sm" onClick={addSlot}>+ 添加分组</Button>
                </div>

                {draftConfig.slots.map((slot, i) => (
                    <div key={i} className="slot-card surface">
                        <div className="pref-row">
                            <Input
                                value={slot.label}
                                onChange={e => updateSlot(i, 'label', e.target.value)}
                                placeholder="分组名称"
                                aria-label={`分组 ${i + 1} 名称`}
                            />
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(i)}>删除</Button>
                        </div>
                        <Textarea
                            value={slot.prompt}
                            onChange={e => updateSlot(i, 'prompt', e.target.value)}
                            placeholder="输入测试 Prompt..."
                            rows={3}
                        />
                    </div>
                ))}

                <Field label="通用负面 (Negative Prompt)">
                    <Textarea
                        value={draftConfig.negative}
                        onChange={e => setDraftConfig({...draftConfig, negative: e.target.value})}
                        rows={3}
                    />
                </Field>

                <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                    <Field label="Seed (-1 = Random)">
                        <div className="pref-row">
                            <Input
                                type="number"
                                value={draftConfig.seed}
                                onChange={e => setDraftConfig({...draftConfig, seed: parseInt(e.target.value)})}
                            />
                            <Button variant="ghost" size="sm" onClick={() => setDraftConfig({...draftConfig, seed: -1})}>随机</Button>
                        </div>
                    </Field>
                    <Field label="Steps">
                        <Input
                            type="number"
                            value={draftConfig.steps}
                            onChange={e => setDraftConfig({...draftConfig, steps: parseInt(e.target.value)})}
                        />
                    </Field>
                    <Field label="Scale">
                        <Input
                            type="number"
                            value={draftConfig.scale}
                            onChange={e => setDraftConfig({...draftConfig, scale: parseFloat(e.target.value)})}
                        />
                    </Field>
                </div>
                <Field label="队列间隔 (ms)">
                    <Input
                        type="number"
                        min={500}
                        value={draftConfig.interval ?? 3000}
                        onChange={e => setDraftConfig({...draftConfig, interval: parseInt(e.target.value)})}
                    />
                </Field>
            </div>

            <div className="sheet-foot">
                <Button variant="ghost" onClick={onClose}>取消</Button>
                <Button onClick={handleSave}>保存配置</Button>
            </div>
        </Sheet>
    );
};
