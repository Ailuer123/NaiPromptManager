import React, { useEffect, useState } from 'react';
import type { ChainType } from '../types';
import { Button } from './ui/Button';
import { Seg } from './ui/Chip';
import { Field, Input, Textarea } from './ui/Field';
import { Sheet } from './ui/Sheet';

const TYPE_OPTIONS = [
  { value: 'style' as const, label: '画师串' },
  { value: 'character' as const, label: '角色串' },
];

export type SaveAsChainSheetProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string, description: string, type: ChainType) => void;
};

export const SaveAsChainSheet: React.FC<SaveAsChainSheetProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChainType>('style');

  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setType('style');
  }, [open]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed, description.trim(), type);
  };

  return (
    <Sheet open={open} onClose={onClose} title="新建串">
      <div className="create-form">
        <Field label="名称">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：新预设"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
          />
        </Field>
        <Field label="描述">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述这个预设的用途..."
          />
        </Field>
        <Field label="类型">
          <Seg
            aria-label="串类型"
            fill
            value={type}
            onChange={setType}
            options={TYPE_OPTIONS}
          />
        </Field>
        <div className="sheet-foot">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button disabled={!name.trim()} onClick={submit}>创建</Button>
        </div>
      </div>
    </Sheet>
  );
};
