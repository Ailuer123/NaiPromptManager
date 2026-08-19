
import React, { useState, useEffect, useMemo } from 'react';
import { PromptChain, ChainType } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Chip, Seg } from './ui/Chip';
import { Empty } from './ui/Empty';
import { Field, Input, Select, Textarea } from './ui/Field';
import { IconButton } from './ui/IconButton';
import { Sheet } from './ui/Sheet';
import { Tag } from './ui/Tag';
import { IconEyeOff, IconLock } from './ui/glyphs';

interface ChainListProps {
  chains: PromptChain[];
  type: ChainType; // New Prop to filter view
  onTypeChange: (type: ChainType) => void;
  onCreate: (name: string, desc: string, type: ChainType) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  notify: (msg: string, type?: 'success' | 'error') => void;
  isGuest?: boolean;
}

const CHAIN_TYPE_OPTIONS = [
  { value: 'style' as const, label: '画师串' },
  { value: 'character' as const, label: '角色串' },
];

const ICONS = {
  refresh: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v16m8-8H4" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.563.044.8.77.38 1.178l-4.244 4.134a.563.563 0 00-.153.476l1.24 5.376c.13.565-.487 1.01-.967.756L12 18.232l-4.894 3.08c-.48.254-1.097-.19-.967-.756l1.24-5.376a.563.563 0 00-.153-.476L2.985 10.575c-.42-.408-.183-1.134.38-1.178l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  person: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

// Internal Component: Smart Copy Modal
const CopyModal: React.FC<{
    chain: PromptChain;
    onClose: () => void;
    notify: (msg: string) => void;
}> = ({ chain, onClose, notify }) => {
    // Default checked based on chain type
    // Artist chain: usually Base (artist tag) + Modules (Style)
    // Character chain: usually Base (char tag) + Modules (Costume)
    const [checkBase, setCheckBase] = useState(true);
    const [checkSubject, setCheckSubject] = useState(false); // Subject is variable, usually skipped for static copy
    const [checkNegative, setCheckNegative] = useState(false);
    
    // Initialize module selection (all active modules checked by default)
    const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        chain.modules?.forEach(m => {
            if (m.isActive) initial[m.id] = true;
        });
        return initial;
    });

    const handleCopy = () => {
        const parts: string[] = [];
        
        // 1. Base
        if (checkBase && chain.basePrompt) parts.push(chain.basePrompt);

        // 2. Pre-Modules
        chain.modules?.forEach(m => {
            if (selectedModules[m.id] && m.position === 'pre') parts.push(m.content);
        });

        // 3. Subject (Optional)
        if (checkSubject && chain.variableValues?.subject) parts.push(chain.variableValues.subject);

        // 4. Post-Modules
        chain.modules?.forEach(m => {
            if (selectedModules[m.id] && (m.position === 'post' || !m.position)) parts.push(m.content);
        });

        const finalPrompt = parts.join(', ').replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '');
        navigator.clipboard.writeText(finalPrompt);
        notify('已复制选中内容');
        onClose();
    };

    const copyNegative = () => {
        navigator.clipboard.writeText(chain.negativePrompt);
        notify('负面 Prompt 已复制');
    };

    return (
        <Sheet open onClose={onClose} title={chain.name} className="copy-sheet">
            {chain.description && (
                <div className="copy-note">
                    <div className="copy-note-label">说明</div>
                    <div className="copy-note-body">{chain.description}</div>
                </div>
            )}

            <div className="copy-section">
                <h4>选择要复制的内容</h4>

                <label className="copy-check">
                    <input type="checkbox" checked={checkBase} onChange={e => setCheckBase(e.target.checked)} />
                    <div>
                        <div className="copy-check-title">基础 Prompt (Base)</div>
                        <div className="copy-check-mono">{chain.basePrompt || '(空)'}</div>
                    </div>
                </label>

                {chain.modules && chain.modules.length > 0 && (
                    <div className="copy-modules">
                        {chain.modules.map(m => (
                            <label key={m.id} className="copy-check copy-check-inline">
                                <input
                                    type="checkbox"
                                    checked={!!selectedModules[m.id]}
                                    onChange={e => setSelectedModules({...selectedModules, [m.id]: e.target.checked})}
                                />
                                <span>{m.name}</span>
                                <span className="copy-check-mono">{m.content}</span>
                            </label>
                        ))}
                    </div>
                )}

                <label className="copy-check">
                    <input type="checkbox" checked={checkSubject} onChange={e => setCheckSubject(e.target.checked)} />
                    <div>
                        <div className="copy-check-title">变量/主体 (Subject)</div>
                        <div className="copy-check-mono">{chain.variableValues?.subject || '(空)'}</div>
                    </div>
                </label>
            </div>

            <div className="copy-neg">
                <div className="copy-neg-head">
                    <span>负面 Prompt</span>
                    <button type="button" className="copy-neg-btn" onClick={copyNegative}>仅复制负面</button>
                </div>
                <div className="copy-check-mono copy-neg-body">{chain.negativePrompt || '(空)'}</div>
            </div>

            <div className="sheet-foot">
                <Button variant="ghost" onClick={onClose}>关闭</Button>
                <Button onClick={handleCopy}>复制选中组合</Button>
            </div>
        </Sheet>
    );
};

export const ChainList: React.FC<ChainListProps> = ({ chains, type, onTypeChange, onCreate, onSelect, onDelete, onRefresh, isLoading, notify, isGuest = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [copyModalChain, setCopyModalChain] = useState<PromptChain | null>(null);
  const [menuChain, setMenuChain] = useState<PromptChain | null>(null);
  const [sortOption, setSortOption] = useState<'updated_desc' | 'updated_asc' | 'created_desc' | 'created_asc'>('updated_desc');
  const [favOnly, setFavOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load favorites from localStorage (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('nai_chain_favs');
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        setFavorites(new Set(parsed));
      }
    } catch (e) {
      console.error('Failed to load chain favorites', e);
    }
  }, []);

  const toggleFav = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('nai_chain_favs', JSON.stringify(Array.from(next)));
      } catch (err) {
        console.error('Failed to save chain favorites', err);
      }
      return next;
    });
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName, newDesc, type);
    setIsModalOpen(false);
    setNewName('');
    setNewDesc('');
  };

  // Memoize allTags extraction
  const allTags = useMemo(() => {
    return Array.from(
      new Set(
        chains.flatMap(chain => chain.tags || [])
      )
    ).sort();
  }, [chains]);

  // Filter chains by Type, search term, favorites, and selected tags
  const filteredChains = useMemo(() => {
    return chains
      .filter(c =>
        (c.type === type || (!c.type && type === 'style')) && // Backward compat: default to style if no type
        (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (c.tags || []).some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      )
      .filter(c => !favOnly || favorites.has(c.id))
      .filter(c => {
        // If no tags are selected, show all
        if (selectedTags.size === 0) return true;
        // Check if the chain has ALL the selected tags (AND logic)
        const chainTagSet = new Set(c.tags || []);
        return Array.from(selectedTags).every(tag => chainTagSet.has(tag));
      })
      .slice()
      .sort((a, b) => {
        const ca = a.createdAt || 0;
        const cb = b.createdAt || 0;
        const ua = a.updatedAt || ca;
        const ub = b.updatedAt || cb;
        switch (sortOption) {
          case 'created_asc':
            return ca - cb;
          case 'created_desc':
            return cb - ca;
          case 'updated_asc':
            return ua - ub;
          case 'updated_desc':
          default:
            return ub - ua;
        }
      });
  }, [chains, type, searchTerm, favOnly, favorites, selectedTags, sortOption]);

  const createLabel = type === 'character' ? '新建角色串' : '新建画师串';
  const segType: ChainType = type === 'character' ? 'character' : 'style';
  const [filterOpen, setFilterOpen] = useState(false);
  const styleCount = chains.filter((c) => c.type === 'style' || !c.type).length;
  const charCount = chains.filter((c) => c.type === 'character').length;

  const openCopy = (chain: PromptChain) => {
    setMenuChain(null);
    setCopyModalChain(chain);
  };

  const handleDeleteFromMenu = (chain: PromptChain) => {
    if (!confirm('确认删除?')) return;
    onDelete(chain.id);
    setMenuChain(null);
  };

  return (
    <div className="board">
      <header className="page-head">
        <div>
          <h1>串看板</h1>
        </div>
        <div className="head-actions">
          <div className="search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3-3" /></svg>
            <Input
              type="search"
              placeholder="搜索名称、标签…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="搜索串"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => setFilterOpen(true)}>筛选</Button>
          {!isGuest && (
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              {ICONS.plus}
              新建串
            </Button>
          )}
        </div>
      </header>

      <div className="chain-toolbar">
        <Seg
          aria-label="串类型"
          value={segType}
          onChange={onTypeChange}
          options={[
            { value: 'style', label: '画师串', count: styleCount },
            { value: 'character', label: '角色串', count: charCount },
          ]}
        />
        {allTags.length > 0 && (
          <div className="chips">
            <Chip
              active={selectedTags.size === 0}
              onClick={() => setSelectedTags(new Set())}
            >
              全部
            </Chip>
            {allTags.map((tag) => (
              <Chip
                key={tag}
                active={selectedTags.has(tag)}
                aria-pressed={selectedTags.has(tag)}
                onClick={() => {
                  const next = new Set(selectedTags);
                  if (next.has(tag)) next.delete(tag);
                  else next.add(tag);
                  setSelectedTags(next);
                }}
              >
                {tag}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {filteredChains.length === 0 ? (
        <Empty
          title="还没有这类串"
          action={!isGuest ? (
            <Button size="sm" onClick={() => setIsModalOpen(true)}>新建串</Button>
          ) : undefined}
        />
      ) : (
        <div className="board-grid">
          {filteredChains.map((chain) => {
            const isFav = favorites.has(chain.id);
            return (
              <Card
                key={chain.id}
                mediaRatio="sq"
                onOpen={() => onSelect(chain.id)}
                media={chain.previewImage ? (
                  <img className="board-cover" src={chain.previewImage} alt={chain.name} />
                ) : (
                  <div className="board-ph">{type === 'character' ? ICONS.person : ICONS.image}</div>
                )}
                title={(
                  <>
                    {chain.isPrivate && (
                      <span className="card-lock" title="私人串：仅 VIP 本人和管理员可见" aria-label="私人串"><IconLock /></span>
                    )}
                    {chain.guestHidden && (
                      <span className="card-lock" title="游客不可见" aria-label="游客不可见"><IconEyeOff /></span>
                    )}
                    {chain.name}
                  </>
                )}
                extra={(
                  <div className="card-extra" data-card-action>
                    <IconButton
                      size="sm"
                      label={isFav ? '取消收藏' : '收藏该串'}
                      className={isFav ? 'is-fav' : undefined}
                      onClick={(e) => toggleFav(chain.id, e)}
                    >
                      {ICONS.star}
                    </IconButton>
                    <IconButton
                      size="sm"
                      label={`更多 ${chain.name}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuChain(chain);
                      }}
                    >
                      {ICONS.more}
                    </IconButton>
                  </div>
                )}
                sub={chain.description || '暂无描述'}
              >
                {chain.tags && chain.tags.length > 0 && (
                  <div className="board-card-tags">
                    {chain.tags.slice(0, 3).map(tag => (
                      <Tag key={tag} title={tag}>{tag}</Tag>
                    ))}
                    {chain.tags.length > 3 && (
                      <Tag>+{chain.tags.length - 3}</Tag>
                    )}
                  </div>
                )}
                <div className="board-meta">
                  <strong title={chain.username}>@{chain.username || 'Unknown'}</strong>
                  <time dateTime={new Date(chain.updatedAt).toISOString()}>
                    {new Date(chain.updatedAt).toLocaleString('zh-CN', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="筛选">
        <div className="stack">
          <Field label="排序">
            <Select
              className="board-sort"
              value={sortOption}
              aria-label="排序"
              onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
            >
              <option value="updated_desc">按最近更新</option>
              <option value="updated_asc">按最早更新</option>
              <option value="created_desc">按最近创建</option>
              <option value="created_asc">按最早创建</option>
            </Select>
          </Field>
          <Chip
            active={favOnly}
            onClick={() => setFavOnly(!favOnly)}
            title="仅显示收藏的串"
            aria-label="仅显示收藏的串"
          >
            {ICONS.star}
            仅收藏
          </Chip>
          <Button variant="secondary" onClick={onRefresh}>
            <span className={isLoading ? 'is-spin' : undefined}>{ICONS.refresh}</span>
            刷新列表
          </Button>
        </div>
      </Sheet>

      <Sheet open={isModalOpen} onClose={() => setIsModalOpen(false)} title={createLabel}>
        <div className="create-form">
          <Field label="名称">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例如：新预设"
              autoFocus
            />
          </Field>
          <Field label="描述">
            <Textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="描述这个预设的用途..."
            />
          </Field>
          <div className="sheet-foot">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>取消</Button>
            <Button onClick={handleCreate}>创建</Button>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={!!menuChain}
        onClose={() => setMenuChain(null)}
        title={menuChain ? menuChain.name : '更多'}
      >
        <div className="sheet-actions">
          <Button
            variant="secondary"
            block
            disabled={!menuChain}
            onClick={() => { if (menuChain) openCopy(menuChain); }}
          >
            复制
          </Button>
          {!isGuest && (
            <Button
              variant="danger"
              block
              disabled={!menuChain}
              onClick={() => { if (menuChain) handleDeleteFromMenu(menuChain); }}
            >
              删除
            </Button>
          )}
        </div>
      </Sheet>

      {copyModalChain && (
          <CopyModal 
            chain={copyModalChain} 
            onClose={() => setCopyModalChain(null)} 
            notify={notify} 
          />
      )}
    </div>
  );
};
