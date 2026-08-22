import React, { useEffect, useState } from 'react';
import { clearApiKey, getApiKey, hasApiKey, isApiKeyRemembered, setApiKey, subscribeApiKey } from '../../services/apiKeyStore';
import { Button } from './Button';
import { Field, Input } from './Field';
import { Seg } from './Chip';
import { Sheet } from './Sheet';
import { Tag } from './Tag';

export function useApiKeyConfigured(): boolean {
  const [configured, setConfigured] = useState(() => hasApiKey());
  useEffect(() => subscribeApiKey(() => setConfigured(hasApiKey())), []);
  return configured;
}

export function ApiKeyFields({ className }: { className?: string }) {
  const [draft, setDraft] = useState(() => getApiKey());
  const [scope, setScope] = useState<'session' | 'local'>(() => (
    isApiKeyRemembered() ? 'local' : 'session'
  ));
  const [status, setStatus] = useState('');

  const save = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      clearApiKey();
      setDraft('');
      setStatus('已清除');
      return;
    }
    setApiKey(trimmed, scope === 'local');
    setStatus(scope === 'local' ? '已保存到本机' : '仅本次会话有效');
  };

  const clear = () => {
    clearApiKey();
    setDraft('');
    setStatus('已清除');
  };

  return (
    <div className={className}>
      <Seg<'session' | 'local'>
        fill
        value={scope}
        onChange={setScope}
        aria-label="API Key 存储范围"
        options={[
          { value: 'session', label: '本次会话' },
          { value: 'local', label: '本机记住' },
        ]}
      />
      <Field
        label="NAI API Key"
        className="mt-4"
        hint={status || undefined}
      >
        <Input
          type="password"
          value={draft}
          placeholder="pst-..."
          autoComplete="off"
          onChange={(e) => {
            setDraft(e.target.value);
            setStatus('');
          }}
        />
      </Field>
      <div className="flex gap-2 mt-4">
        <Button variant="secondary" size="sm" onClick={save}>保存密钥</Button>
        <Button variant="ghost" size="sm" onClick={clear}>清除</Button>
      </div>
    </div>
  );
}

export function ApiKeySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="API Key">
      {open ? <ApiKeyFields /> : null}
    </Sheet>
  );
}

export function ApiKeyBadge({
  configured,
  onClick,
}: {
  configured: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center flex-shrink-0"
      title="配置 API Key"
    >
      <Tag tone={configured ? 'sage' : undefined}>
        {configured ? '已配置' : '未配置'}
      </Tag>
    </button>
  );
}
