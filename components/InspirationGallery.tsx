
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../services/dbService';
import { Inspiration, User, NAIParams } from '../types';
import { extractMetadata, parseNovelAIMetadata, ParsedNAIData, IMPORT_SESSION_KEY } from '../services/metadataService';
import { ParamsViewer } from './ParamsViewer';
import { Button, Card, Empty, Field, IconButton, IconClose, Input, Portal, Sheet, Tag, Textarea } from './ui';
import { cx } from './ui/cx';

interface InspirationGalleryProps {
    currentUser: User;
    // New props for caching
    inspirationsData: Inspiration[] | null;
    onRefresh: () => Promise<void>;
    notify: (msg: string, type?: 'success' | 'error') => void;
    onNavigateToPlayground?: () => void;
}

interface InspirationLightboxProps {
    lightboxImg: {item: Inspiration, isEditing: boolean};
    setLightboxImg: React.Dispatch<React.SetStateAction<{item: Inspiration, isEditing: boolean} | null>>;
    handleSaveEdit: () => Promise<void>;
    copyPrompt: (prompt: string, e?: React.MouseEvent) => void;
    canEdit: (item: Inspiration) => boolean;
    getDownloadFilename: () => string;
    notify: (msg: string, type?: 'success' | 'error') => void;
    onNavigateToPlayground?: () => void;
}

// Lazy Loading Component (Reused logic, kept separate per component for modularity if needed)
const LazyImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsInView(true);
                observer.disconnect();
            }
        }, { threshold: 0.1 });

        if (imgRef.current) observer.observe(imgRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={imgRef} className="ph-media">
            {isInView && (
                <img
                    src={src}
                    alt={alt}
                    className={isLoaded ? 'is-on' : 'is-off'}
                    onLoad={() => setIsLoaded(true)}
                />
            )}
            {!isLoaded && isInView && (
                <div className="ph-miss">…</div>
            )}
        </div>
    );
};

const InspirationLightbox: React.FC<InspirationLightboxProps> = ({
    lightboxImg,
    setLightboxImg,
    handleSaveEdit,
    copyPrompt,
    canEdit,
    getDownloadFilename,
    notify,
    onNavigateToPlayground
}) => {
    // 尝试解析灵感图的 prompt 字符串，提取结构化参数，使用 useMemo 避免重复重排
    const parsedData: ParsedNAIData | null = useMemo(() => {
        try {
            if (lightboxImg.item.params) {
                const parsedFromPrompt = lightboxImg.item.prompt ? parseNovelAIMetadata(lightboxImg.item.prompt) : null;
                return {
                    prompt: parsedFromPrompt?.prompt || lightboxImg.item.prompt,
                    negativePrompt: parsedFromPrompt?.negativePrompt || '',
                    params: lightboxImg.item.params
                };
            }
            if (lightboxImg.item.prompt && lightboxImg.item.prompt.trim()) {
                return parseNovelAIMetadata(lightboxImg.item.prompt);
            }
        } catch { /* 解析失败不影响展示 */ }
        return null;
    }, [lightboxImg.item.prompt, lightboxImg.item.params]);

    return (
      <Portal>
        <div className="lbx" onClick={() => setLightboxImg(null)}>
            <div className="lbx-split glass-strong" onClick={e => e.stopPropagation()}>
                <div className="lbx-media">
                    <img src={lightboxImg.item.imageUrl} alt={lightboxImg.item.title} />
                </div>
                <div className="lbx-side wide">
                    <div className="pref-row" style={{ marginBottom: 12 }}>
                        {lightboxImg.isEditing ? (
                            <Input value={lightboxImg.item.title} onChange={e => setLightboxImg({...lightboxImg, item: {...lightboxImg.item, title: e.target.value}})} />
                        ) : (
                            <div>
                                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{lightboxImg.item.title}</h2>
                                <p className="hint">by {lightboxImg.item.username || 'Unknown'}</p>
                            </div>
                        )}
                        <IconButton label="关闭" onClick={() => setLightboxImg(null)}><IconClose /></IconButton>
                    </div>

                    <div className="page-scroll" style={{ flex: 1, marginBottom: 12 }}>
                        {lightboxImg.isEditing ? (
                            <Textarea value={lightboxImg.item.prompt} onChange={e => setLightboxImg({...lightboxImg, item: {...lightboxImg.item, prompt: e.target.value}})} rows={10} />
                        ) : parsedData ? (
                            <ParamsViewer
                                params={parsedData.params}
                                prompt={parsedData.prompt}
                                negativePrompt={parsedData.negativePrompt}
                                notify={notify}
                            />
                        ) : (
                            <div className="compiled">{lightboxImg.item.prompt}</div>
                        )}
                    </div>

                    <div className="create-form">
                        {lightboxImg.isEditing ? (
                            <div className="sheet-foot">
                                <Button variant="ghost" onClick={() => setLightboxImg({...lightboxImg, isEditing: false})}>取消</Button>
                                <Button onClick={handleSaveEdit}>保存</Button>
                            </div>
                        ) : (
                            <>
                              {parsedData && (
                                  <Button
                                      block
                                      onClick={() => {
                                          sessionStorage.setItem(IMPORT_SESSION_KEY, JSON.stringify(parsedData));
                                          setLightboxImg(null);
                                          notify('参数已准备就绪，正在跳转到编辑器...');
                                          onNavigateToPlayground?.();
                                      }}
                                  >
                                      导入到编辑器
                                  </Button>
                              )}
                              <Button variant="secondary" block onClick={() => copyPrompt(lightboxImg.item.prompt)}>复制 Prompt</Button>
                              {canEdit(lightboxImg.item) && (
                                  <Button variant="ghost" block onClick={() => setLightboxImg({...lightboxImg, isEditing: true})}>编辑详情</Button>
                              )}
                              <a href={lightboxImg.item.imageUrl} download={getDownloadFilename()} className="btn btn-ghost btn-block">
                                  下载原图
                              </a>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </Portal>
    );
};

export const InspirationGallery: React.FC<InspirationGalleryProps> = ({ currentUser, inspirationsData, onRefresh, notify, onNavigateToPlayground }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxImg, setLightboxImg] = useState<{item: Inspiration, isEditing: boolean} | null>(null);
  const [uploadMode, setUploadMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Upload State
  const [upTitle, setUpTitle] = useState('');
  const [upImg, setUpImg] = useState('');
  const [upPrompt, setUpPrompt] = useState('');

  // Initial load handled by App.tsx now
  // removed empty useEffect that called load

  const handleRefresh = async () => {
      setIsLoading(true);
      await onRefresh();
      setIsLoading(false);
  };

  const getDownloadFilename = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      return `NAI-${timestamp}.png`;
  };

  const copyPrompt = (prompt: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    navigator.clipboard.writeText(prompt);
    notify('Prompt 已复制');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setUpImg(reader.result as string);
        reader.readAsDataURL(file);
        const meta = await extractMetadata(file);
        if (meta) {
            setUpPrompt(meta);
            if (!upTitle) setUpTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
    }
  };

  const handleUpload = async () => {
      if (!upTitle || !upImg) return;
      let parsedParams: NAIParams | undefined = undefined;
      if (upPrompt && upPrompt.trim()) {
          try {
              const parsed = parseNovelAIMetadata(upPrompt);
              parsedParams = parsed.params;
          } catch { /* 解析失败时 params 为 undefined */ }
      }
      await db.saveInspiration({
          id: crypto.randomUUID(),
          title: upTitle,
          imageUrl: upImg,
          prompt: upPrompt,
          params: parsedParams,
          userId: currentUser.id,
          username: currentUser.username,
          createdAt: Date.now()
      });
      setUploadMode(false);
      setUpTitle(''); setUpImg(''); setUpPrompt('');
      onRefresh();
  };

  const handleSaveEdit = async () => {
      if (!lightboxImg) return;
      await db.updateInspiration(lightboxImg.item.id, {
          title: lightboxImg.item.title,
          prompt: lightboxImg.item.prompt
      });
      setLightboxImg(null);
      onRefresh();
  };

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
      if (selectedIds.size === 0) return;
      if (!confirm(`确认删除选中的 ${selectedIds.size} 张图片吗？`)) return;
      await db.bulkDeleteInspirations(Array.from(selectedIds));
      setSelectedIds(new Set());
      setSelectionMode(false);
      onRefresh();
  };

  const canEdit = (item: Inspiration) => item.userId === currentUser.id || currentUser.role === 'admin';

  const filtered = (inspirationsData || []).filter(i => 
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.prompt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-fill">
      <header className="board-head insp-head">
          <div className="board-head-top">
             <div>
                 <h1>灵感图库</h1>
             </div>
            <IconButton label="刷新灵感库" onClick={handleRefresh}>
                <span className={isLoading ? 'is-spin' : undefined}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </span>
            </IconButton>
          </div>
          <div className="board-tools">
              {selectionMode ? (
                  <>
                    <span className="hint" style={{ flex: 1 }}>已选 {selectedIds.size}</span>
                    <Button variant="danger" size="sm" onClick={handleBulkDelete}>删除</Button>
                    <Button variant="ghost" size="sm" onClick={() => {setSelectionMode(false); setSelectedIds(new Set())}}>取消</Button>
                  </>
              ) : (
                  <>
                    <Input
                        type="text"
                        className="board-search"
                        placeholder="搜索..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        aria-label="搜索灵感"
                    />
                    <Button variant="secondary" size="sm" onClick={() => setSelectionMode(true)}>管理</Button>
                    <Button size="sm" onClick={() => setUploadMode(true)}>上传</Button>
                  </>
              )}
          </div>
      </header>

      <div className="page-scroll">
             {filtered.length === 0 ? (
                 <Empty
                    title="暂无灵感"
                    description={searchTerm ? '没有匹配的图片。' : undefined}
                    action={!searchTerm ? <Button variant="ghost" onClick={() => setUploadMode(true)}>上传</Button> : undefined}
                 />
             ) : (
             <div className="insp-grid">
                 {filtered.map(item => (
                     <Card
                        key={item.id}
                        className={cx(selectionMode && selectedIds.has(item.id) && 'is-picked')}
                        mediaRatio="portrait"
                        onOpen={() => selectionMode ? toggleSelection(item.id) : setLightboxImg({item, isEditing: false})}
                        media={(
                            <>
                                <LazyImage src={item.imageUrl} alt={item.title} />
                                {selectionMode && (
                                    <div className="insp-sel">
                                        {selectedIds.has(item.id) && <span>✓</span>}
                                    </div>
                                )}
                            </>
                        )}
                        title={item.title}
                        extra={item.username ? <Tag>{item.username}</Tag> : undefined}
                        sub={item.prompt}
                     />
                 ))}
             </div>
             )}
      </div>

      <Sheet open={uploadMode} onClose={() => setUploadMode(false)} title="上传灵感图">
          <div className="create-form">
              <div className="drop-zone">
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="up-file" />
                  <label htmlFor="up-file" className="cursor-pointer block">
                      {upImg ? <img src={upImg} alt="" /> : <span>点击选择图片（自动读取 Prompt）</span>}
                  </label>
              </div>
              <Field label="标题">
                  <Input value={upTitle} onChange={e => setUpTitle(e.target.value)} placeholder="标题" />
              </Field>
              <Field label="Prompt">
                  <Textarea value={upPrompt} onChange={e => setUpPrompt(e.target.value)} placeholder="Prompt" />
              </Field>
              <div className="sheet-foot">
                  <Button variant="ghost" onClick={() => setUploadMode(false)}>取消</Button>
                  <Button onClick={handleUpload}>上传</Button>
              </div>
          </div>
      </Sheet>

      {/* Lightbox / Details Editor */}
      {lightboxImg && (
          <InspirationLightbox
              lightboxImg={lightboxImg}
              setLightboxImg={setLightboxImg}
              handleSaveEdit={handleSaveEdit}
              copyPrompt={copyPrompt}
              canEdit={canEdit}
              getDownloadFilename={getDownloadFilename}
              notify={notify}
              onNavigateToPlayground={onNavigateToPlayground}
          />
      )}
    </div>
  );
};
