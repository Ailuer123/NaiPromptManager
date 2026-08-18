import React from 'react';
import { cx } from './cx';
import type { CompiledPromptSegments } from '../../services/promptUtils';

export type CompiledSegId = 'base' | 'pre' | 'subject' | 'post' | 'neg';

const POSITIVE: Array<{ id: Exclude<CompiledSegId, 'neg'>; label: string }> = [
  { id: 'base', label: '基础' },
  { id: 'pre', label: '前置' },
  { id: 'subject', label: '主体' },
  { id: 'post', label: '后置' },
];

export type CompiledPromptProps = {
  segments: CompiledPromptSegments;
  negative?: string;
  highlight?: CompiledSegId | null;
  onHighlight?: (id: CompiledSegId | null) => void;
  onCopy?: (label: string, text: string) => void;
};

export function CompiledPrompt({
  segments,
  negative,
  highlight,
  onHighlight,
  onCopy,
}: CompiledPromptProps) {
  const items: Array<{ id: CompiledSegId; label: string; text: string }> = POSITIVE.map((item) => ({
    ...item,
    text: segments[item.id],
  }));
  if (negative != null) {
    items.push({ id: 'neg', label: '负面', text: negative });
  }

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
    onCopy?.(label, text);
  };

  return (
    <div className="compiled">
      {items.map((seg) => (
        <div
          key={seg.id}
          className={cx('compiled-seg', highlight === seg.id && 'lit')}
          data-seg={seg.id}
          tabIndex={0}
          title={`点击复制${seg.label}`}
          onMouseEnter={() => onHighlight?.(seg.id)}
          onMouseLeave={() => onHighlight?.(null)}
          onClick={() => copy(seg.label, seg.text)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              copy(seg.label, seg.text);
            }
          }}
        >
          <span className="seg-label">{seg.label}</span>
          <div className="seg-text">{seg.text}</div>
        </div>
      ))}
    </div>
  );
}
