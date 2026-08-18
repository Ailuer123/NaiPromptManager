
import React, { useState, useEffect, useRef } from 'react';
import { localHistory } from '../services/localHistory';
import { db } from '../services/dbService';
import { LocalGenItem, User } from '../types';
import { PAGINATION_CONFIG } from '../config/pagination';
import { IMPORT_SESSION_KEY } from '../services/metadataService';
import { ParamsViewer } from './ParamsViewer';
import {
    compressPngToJpg,
    isJpgDataUri,
} from '../services/imageCompression';
import { Button, Card, Empty, Field, IconButton, Input, Sheet } from './ui';

interface GenHistoryProps {
    currentUser: User;
    notify: (msg: string, type?: 'success' | 'error') => void;
    onNavigateToPlayground?: () => void;
    onRefreshInspiration?: () => void;
}

// --- 历史压缩相关常量 ---
/** JPG 质量默认值（与 ArtistAdmin "偏好设置" 共享） */
const DEFAULT_QUALITY = 0.85;
/** Lightbox 预览的 debounce 时长（毫秒） */
const PREVIEW_DEBOUNCE_MS = 400;
/** 平均耗时滑动窗口大小（用于"预计剩余 T 秒"估算） */
const TIMING_WINDOW = 10;

/** 从 LocalStorage 读取当前 JPG 质量；做边界保护 */
const readQuality = (): number => {
    const raw = localStorage.getItem('naipm.compaction.quality');
    if (!raw) return DEFAULT_QUALITY;
    const v = parseFloat(raw);
    if (isNaN(v)) return DEFAULT_QUALITY;
    return Math.min(1, Math.max(0.01, v));
};

/** 字节数 → MB 友好显示 */
const formatMB = (bytes: number): string => {
    if (bytes <= 0) return '0';
    const mb = bytes / (1024 * 1024);
    return mb < 0.01 ? mb.toFixed(3) : mb.toFixed(2);
};

export const GenHistory: React.FC<GenHistoryProps> = ({ currentUser, notify, onNavigateToPlayground, onRefreshInspiration }) => {
    const [items, setItems] = useState<LocalGenItem[]>([]);
    const [lightbox, setLightbox] = useState<LocalGenItem | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishTitle, setPublishTitle] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // 分页相关状态
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // 缓存管理
    const [pageCache, setPageCache] = useState<Record<number, LocalGenItem[]>>({});
    const pageCacheRef = useRef<Record<number, LocalGenItem[]>>({});
    const inflightPagesRef = useRef<Record<number, Promise<LocalGenItem[]>>>({});

    // 清理相关状态
    const [showCleanMenu, setShowCleanMenu] = useState(false);
    const [showCleanModal, setShowCleanModal] = useState(false);
    const [cleanMode, setCleanMode] = useState<'days' | 'count'>('days');
    const [cleanDays, setCleanDays] = useState<number>(PAGINATION_CONFIG.CLEANUP.DEFAULT_DAYS);
    const [cleanCount, setCleanCount] = useState<number>(PAGINATION_CONFIG.CLEANUP.DEFAULT_COUNT);
    const [cleanPreviewCount, setCleanPreviewCount] = useState(0);

    // --- 历史压缩状态 ---
    /** 库内待压缩 PNG 的数量（用于 disabled 判定） */
    const [pendingPngCount, setPendingPngCount] = useState(0);
    /** 批量压缩确认弹窗 */
    const [showCompactConfirm, setShowCompactConfirm] = useState(false);
    /** 批量压缩进度模态 */
    const [compactProgress, setCompactProgress] = useState<{
        total: number;
        processed: number;
        savedBytes: number;
        failed: number;
        remainingSec: number;
    } | null>(null);
    /** 批量压缩取消标志（ref 以便循环内同步读取） */
    const compactCancelRef = useRef<boolean>(false);
    /** 批量压缩完成摘要 */
    const [compactSummary, setCompactSummary] = useState<{
        success: number;
        failed: number;
        savedBytes: number;
        originalTotal: number;
    } | null>(null);

    // --- Lightbox 单张压缩状态 ---
    /** 实时预览的 JPG Data URI（仅 Lightbox 内、原图为 PNG 时使用） */
    const [previewJpgDataUri, setPreviewJpgDataUri] = useState<string | null>(null);
    /** Lightbox 滑块当前的 JPG 质量（独立 state，避免每次 keystroke 都写 LocalStorage） */
    const [lightboxQuality, setLightboxQuality] = useState<number>(() => readQuality());
    /** 当前正在生成预览 */
    const [previewing, setPreviewing] = useState(false);
    /** 并排预览的双列同步滚动容器 ref，监听 scroll 镜像 scrollTop/scrollLeft */
    const previewLeftRef = useRef<HTMLDivElement | null>(null);
    const previewRightRef = useRef<HTMLDivElement | null>(null);
    /** 同步 scroll 时的"内部触发"标记，防止 A→B→A 反向回弹无限循环 */
    const scrollSyncingRef = useRef<boolean>(false);
    /** 单张压缩进行中 */
    const [singleCompacting, setSingleCompacting] = useState(false);
    /** 预览 debounce timer */
    const previewTimerRef = useRef<number | null>(null);

    // --- 引导弹窗 ---
    const [showOnboarding, setShowOnboarding] = useState(false);

    // 初次挂载：加载第一页 + 检查是否需要引导
    useEffect(() => {
        goToPage(1);
        // 仅登录用户、未展示过 → 弹引导
        if (currentUser.role !== 'guest' && localStorage.getItem('naipm.compaction.onboarded') !== 'true') {
            setShowOnboarding(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ESC 关闭引导弹窗（任意关闭语义都等于"暂不启用 + 标记已展示"）
    useEffect(() => {
        if (!showOnboarding) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') dismissOnboarding(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showOnboarding]);

    const { PAGE_SIZE } = PAGINATION_CONFIG;

    const setCacheState = (nextCache: Record<number, LocalGenItem[]>) => {
        pageCacheRef.current = nextCache;
        setPageCache(nextCache);
    };

    const trimCacheAroundPage = (centerPage: number, totalPages: number, extraPages: Record<number, LocalGenItem[]> = {}) => {
        const validPages = [centerPage - 1, centerPage, centerPage + 1].filter(page => page >= 1 && page <= totalPages);
        const nextCache: Record<number, LocalGenItem[]> = {};

        validPages.forEach(page => {
            const data = extraPages[page] ?? pageCacheRef.current[page];
            if (data) {
                nextCache[page] = data;
            }
        });

        setCacheState(nextCache);
    };

    // 获取页面数据（优先从缓存）
    const getPageData = async (page: number): Promise<LocalGenItem[]> => {
        const cached = pageCacheRef.current[page];
        if (cached) {
            return cached;
        }

        const inflight = inflightPagesRef.current[page];
        if (inflight) {
            return inflight;
        }

        const request = localHistory.getPage(page - 1, PAGE_SIZE)
            .then(data => {
                delete inflightPagesRef.current[page];
                return data;
            })
            .catch(error => {
                delete inflightPagesRef.current[page];
                throw error;
            });

        inflightPagesRef.current[page] = request;
        return request;
    };

    const preloadPage = async (page: number, totalPages: number) => {
        if (page < 1 || page > totalPages) {
            return;
        }

        try {
            const data = await getPageData(page);

            if (!pageCacheRef.current[page]) {
                const nextCache = {
                    ...pageCacheRef.current,
                    [page]: data,
                };
                setCacheState(nextCache);
                trimCacheAroundPage(currentPage, totalPages, nextCache);
            }
        } catch (e) {
            console.warn('预加载页面失败:', e);
        }
    };

    /**
     * 扫描全库统计未压缩 PNG 数量。
     * 用于"压缩 PNG..."按钮的 disabled 判定。本地数据，O(n) 但 n 一般 ≤ 几千条可接受。
     */
    const refreshPendingPngCount = async () => {
        try {
            const all = await localHistory.getAll();
            const pending = all.filter(it => !isJpgDataUri(it.imageUrl)).length;
            setPendingPngCount(pending);
        } catch (e) {
            console.warn('统计未压缩 PNG 数量失败:', e);
        }
    };

    // 跳转到指定页
    const goToPage = async (page: number, force: boolean = false) => {
        if (isLoading) return;

        // 计算总页数
        const count = await localHistory.getCount();
        const calculatedTotalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

        // 边界检查
        const targetPage = Math.max(1, Math.min(page, calculatedTotalPages));

        // 如果不是强制刷新，且目标页与当前页相同，则跳过
        if (!force && targetPage === currentPage && items.length > 0) return;

        setIsLoading(true);
        setCurrentPage(targetPage);
        setTotalPages(calculatedTotalPages);
        setTotalCount(count);

        try {
            // 获取页面数据
            const data = await getPageData(targetPage);
            setItems(data);

            // 更新缓存并清理
            const nextCache = {
                ...pageCacheRef.current,
                [targetPage]: data,
            };
            setCacheState(nextCache);
            trimCacheAroundPage(targetPage, calculatedTotalPages, nextCache);

            // 预加载相邻页面（当前页 +1 和 -1）
            if (targetPage > 1) {
                void preloadPage(targetPage - 1, calculatedTotalPages);
            }
            if (targetPage < calculatedTotalPages) {
                void preloadPage(targetPage + 1, calculatedTotalPages);
            }

            // 同时更新待压缩 PNG 计数（用于按钮 disabled 判定）
            void refreshPendingPngCount();

        } catch (e) {
            console.error('加载页面失败:', e);
            notify('加载失败，请重试', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // 生成页码按钮
    const getPageButtons = (): number[] => {
        const buttons: number[] = [];
        const maxButtons = 7; // 最多显示7个页码按钮

        if (totalPages <= maxButtons) {
            // 总页数较少，显示所有页码
            for (let i = 1; i <= totalPages; i++) {
                buttons.push(i);
            }
        } else {
            // 总页数较多，显示当前页附近的页码
            const start = Math.max(1, currentPage - 3);
            const end = Math.min(totalPages, start + maxButtons - 1);

            for (let i = start; i <= end; i++) {
                buttons.push(i);
            }
        }

        return buttons;
    };

    /**
     * 根据 Lightbox 当前图片的 Data URI 前缀生成下载文件名。
     *
     * 历史压缩为 JPG 后下载扩展名也要对应改变 —— 见 ADR-0001。
     */
    const getDownloadFilename = (imageUrl?: string) => {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        const ext = imageUrl && isJpgDataUri(imageUrl) ? 'jpg' : 'png';
        return `NAI-${timestamp}.${ext}`;
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('确定删除这张图片记录吗？(无法恢复)')) {
            await localHistory.delete(id);
            if (lightbox?.id === id) setLightbox(null);
            // 清空缓存并强制刷新当前页
            setCacheState({});
            await goToPage(currentPage, true);
        }
    };

    const handleClearAll = async () => {
        if (confirm('确定清空所有本地生图历史吗？')) {
            await localHistory.clear();
            setItems([]);
            setTotalCount(0);
            setShowCleanMenu(false);
            setPendingPngCount(0);
        }
    };

    const handleCleanMenuClick = (mode: 'days' | 'count') => {
        setCleanMode(mode);
        setShowCleanMenu(false);
        setShowCleanModal(true);

        // 预览将删除的数量
        if (mode === 'days') {
            localHistory.countOlderThan(cleanDays).then(setCleanPreviewCount);
        } else {
            localHistory.getCount().then(count => {
                setCleanPreviewCount(Math.max(0, count - cleanCount));
            });
        }
    };

    const handleCleanConfirm = async () => {
        try {
            if (cleanMode === 'days') {
                await localHistory.deleteOlderThan(cleanDays);
            } else {
                await localHistory.keepOnly(cleanCount);
            }
            setShowCleanModal(false);
            // 清空缓存，强制刷新页面数据和总数
            setCacheState({});
            await goToPage(1, true); // 强制重新加载第一页，刷新总数
            notify('清理完成');
        } catch (e: any) {
            notify('清理失败: ' + e.message, 'error');
        }
    };

    const handlePublish = async () => {
        if (!lightbox) return;
        if (!publishTitle.trim()) {
            notify('请输入标题', 'error');
            return;
        }
        setIsPublishing(true);
        try {
            await db.saveInspiration({
                id: crypto.randomUUID(),
                title: publishTitle,
                imageUrl: lightbox.imageUrl,
                prompt: lightbox.prompt,
                params: lightbox.params,
                userId: currentUser.id,
                username: currentUser.username,
                createdAt: Date.now()
            });
            notify('发布成功！已加入灵感图库');
            setIsPublishing(false);
            setPublishTitle('');
            setLightbox(null);
            setShowSuccessModal(true);
            onRefreshInspiration?.();
        } catch (e: any) {
            notify('发布失败: ' + e.message, 'error');
            setIsPublishing(false);
        }
    };

    // --- 引导弹窗：关闭语义统一 ---
    /**
     * 关闭引导弹窗：无论"启用"还是"暂不启用 / X / ESC / 遮罩"都写 onboarded='true'。
     * @param enable true=同时打开"自动 JPG 保存"开关；false=仅标记已展示
     */
    const dismissOnboarding = (enable: boolean) => {
        localStorage.setItem('naipm.compaction.onboarded', 'true');
        if (enable) {
            localStorage.setItem('naipm.compaction.autoJpg', 'true');
            notify('已开启"自动 JPG 保存"');
        }
        setShowOnboarding(false);
    };

    // --- 批量压缩主流程 ---
    const handleStartBatchCompact = () => {
        setShowCleanMenu(false);
        if (pendingPngCount === 0) return; // 二次保险
        setShowCompactConfirm(true);
    };

    const handleConfirmBatchCompact = async () => {
        setShowCompactConfirm(false);
        const quality = readQuality();

        // 拉全库做主循环。批量压缩与分页解耦：直接走 getAll 一遍。
        const all = await localHistory.getAll();
        const total = all.length;
        compactCancelRef.current = false;
        const timings: number[] = [];
        let processed = 0;
        let savedBytes = 0;
        let originalTotal = 0;
        let failed = 0;
        let success = 0;

        setCompactProgress({ total, processed: 0, savedBytes: 0, failed: 0, remainingSec: 0 });

        for (const item of all) {
            if (compactCancelRef.current) break;

            // 幂等：已是 JPG 跳过；processed 仍 +1 让用户感知"扫过了"
            if (isJpgDataUri(item.imageUrl)) {
                processed++;
                setCompactProgress({ total, processed, savedBytes, failed, remainingSec: computeRemaining(timings, total, processed) });
                continue;
            }

            const start = performance.now();
            try {
                const { jpgDataUri, originalBytes, compressedBytes } = await compressPngToJpg(item.imageUrl, quality);
                await localHistory.updateImage(item.id, jpgDataUri);
                const saved = Math.max(0, originalBytes - compressedBytes);
                savedBytes += saved;
                originalTotal += originalBytes;
                success++;
                timings.push(performance.now() - start);
                if (timings.length > TIMING_WINDOW) timings.shift();
            } catch (e) {
                console.warn('压缩失败 id=' + item.id, e);
                failed++;
            }

            processed++;
            setCompactProgress({ total, processed, savedBytes, failed, remainingSec: computeRemaining(timings, total, processed) });
            // 让出主线程，避免锁死 UI
            await new Promise(r => setTimeout(r, 0));
        }

        // 完成 / 取消都进摘要
        setCompactProgress(null);
        setCompactSummary({ success, failed, savedBytes, originalTotal });
        compactCancelRef.current = false;

        // 刷新当前页和待压缩计数
        setCacheState({});
        await goToPage(currentPage, true);
    };

    const computeRemaining = (timings: number[], total: number, processed: number): number => {
        if (timings.length === 0) return 0;
        const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
        const remainingMs = avg * (total - processed);
        return Math.max(0, Math.round(remainingMs / 1000));
    };

    const handleCancelBatchCompact = () => {
        compactCancelRef.current = true;
    };

    // --- Lightbox 单张压缩 ---
    /** Lightbox 打开 / 切图时，重置预览相关状态 */
    useEffect(() => {
        // 清掉旧 timer / 预览
        if (previewTimerRef.current) {
            window.clearTimeout(previewTimerRef.current);
            previewTimerRef.current = null;
        }
        setPreviewJpgDataUri(null);
        setPreviewing(false);
        setLightboxQuality(readQuality());
    }, [lightbox?.id]);

    /**
     * 双列同步滚动：当并排预览开启时，监听任一容器的 scroll 事件，
     * 把 scrollTop/scrollLeft 镜像到另一侧。
     *
     * 关键防回弹：A 触发 onScroll 后我们写 B.scrollTop = A.scrollTop，
     * 这又会让 B 的 onScroll 触发；用 scrollSyncingRef 标记"这是内部回写"，
     * 让对侧 listener 直接 return，避免无限循环。
     */
    useEffect(() => {
        const left = previewLeftRef.current;
        const right = previewRightRef.current;
        // 双方都挂载且并排预览正在显示
        if (!left || !right || !previewJpgDataUri || lightboxIsJpg) return;

        const sync = (source: HTMLDivElement, target: HTMLDivElement) => {
            if (scrollSyncingRef.current) {
                scrollSyncingRef.current = false;
                return;
            }
            scrollSyncingRef.current = true;
            target.scrollTop = source.scrollTop;
            target.scrollLeft = source.scrollLeft;
        };

        const onLeft = () => sync(left, right);
        const onRight = () => sync(right, left);
        left.addEventListener('scroll', onLeft, { passive: true });
        right.addEventListener('scroll', onRight, { passive: true });
        return () => {
            left.removeEventListener('scroll', onLeft);
            right.removeEventListener('scroll', onRight);
        };
        // 依赖 previewJpgDataUri：预览首次出现 / 切换图片时重新挂载 listener
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previewJpgDataUri, lightbox?.id]);

    /** 触发软实时预览（debounce） */
    const schedulePreview = (quality: number) => {
        if (!lightbox || isJpgDataUri(lightbox.imageUrl)) return;
        if (previewTimerRef.current) {
            window.clearTimeout(previewTimerRef.current);
        }
        previewTimerRef.current = window.setTimeout(async () => {
            if (!lightbox) return;
            setPreviewing(true);
            try {
                const { jpgDataUri } = await compressPngToJpg(lightbox.imageUrl, quality);
                setPreviewJpgDataUri(jpgDataUri);
            } catch (e) {
                console.warn('预览生成失败:', e);
            } finally {
                setPreviewing(false);
            }
        }, PREVIEW_DEBOUNCE_MS);
    };

    const handleLightboxQualityChange = (v: number) => {
        const clamped = Math.min(1, Math.max(0.01, v));
        setLightboxQuality(clamped);
        schedulePreview(clamped);
    };

    /** 单张：把当前 Lightbox 的 PNG 就地替换为 JPG */
    const handleSingleCompact = async () => {
        if (!lightbox || isJpgDataUri(lightbox.imageUrl)) return;
        setSingleCompacting(true);
        try {
            const { jpgDataUri, originalBytes, compressedBytes } = await compressPngToJpg(lightbox.imageUrl, lightboxQuality);
            await localHistory.updateImage(lightbox.id, jpgDataUri);
            const savedKB = Math.max(0, (originalBytes - compressedBytes) / 1024);
            notify(`已压缩，节省 ${savedKB < 1024 ? savedKB.toFixed(0) + ' KB' : (savedKB / 1024).toFixed(2) + ' MB'}`);

            // Lightbox 内同步更新展示
            const updated: LocalGenItem = { ...lightbox, imageUrl: jpgDataUri };
            setLightbox(updated);
            setPreviewJpgDataUri(null);

            // 主网格同步：清空缓存并强制重载当前页
            setCacheState({});
            await goToPage(currentPage, true);
        } catch (e: any) {
            notify('压缩失败: ' + (e.message || e), 'error');
        } finally {
            setSingleCompacting(false);
        }
    };

    // 当前 Lightbox 图是否已经压缩过
    const lightboxIsJpg = lightbox ? isJpgDataUri(lightbox.imageUrl) : false;

    return (
        <div className="page-fill">
            <header className="board-head hist-head">
                <div className="board-head-top">
                    <div>
                        <h1>本地生图历史</h1>
                        <p>仅存储在您的浏览器中</p>
                    </div>
                    <div className="board-tools">
                        <span className="hint">共 {totalCount} 张</span>
                        <div className="relative">
                            <Button variant="danger" size="sm" onClick={() => setShowCleanMenu(!showCleanMenu)}>
                                清理
                            </Button>
                            {showCleanMenu && (
                                <div className="hist-menu surface-strong">
                                    <button type="button" onClick={handleClearAll}>🗑️ 清空全部</button>
                                    <button type="button" onClick={() => handleCleanMenuClick('days')}>⏰ 删除 X 天前的...</button>
                                    <button type="button" onClick={() => handleCleanMenuClick('count')}>📊 只保留最近 N 张...</button>
                                    <button
                                        type="button"
                                        onClick={pendingPngCount === 0 ? undefined : handleStartBatchCompact}
                                        disabled={pendingPngCount === 0}
                                        title={pendingPngCount === 0 ? '无需压缩' : `压缩 ${pendingPngCount} 张 PNG 为 JPG`}
                                    >
                                        📦 压缩 PNG... {pendingPngCount > 0 && <span className="hint">（{pendingPngCount} 张）</span>}
                                    </button>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="hist-compact-desk"
                            onClick={pendingPngCount === 0 ? undefined : handleStartBatchCompact}
                            disabled={pendingPngCount === 0}
                            title={pendingPngCount === 0 ? '无需压缩' : `压缩 ${pendingPngCount} 张 PNG 为 JPG`}
                        >
                            📦 压缩
                            {pendingPngCount > 0 && <span className="hint">{pendingPngCount}</span>}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => goToPage(currentPage)}>刷新</Button>
                    </div>
                </div>

                {totalCount > 0 && (
                    <div className="hist-pager surface">
                        <div className="hist-pages">
                            <Button size="sm" variant="ghost" onClick={() => goToPage(1)} disabled={currentPage === 1 || isLoading}>首页</Button>
                            <Button size="sm" variant="ghost" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || isLoading}>上一页</Button>
                            {getPageButtons().map(page => (
                                <Button
                                    key={page}
                                    size="sm"
                                    variant={page === currentPage ? 'primary' : 'ghost'}
                                    onClick={() => goToPage(page)}
                                >
                                    {page}
                                </Button>
                            ))}
                            <Button size="sm" variant="ghost" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || isLoading}>下一页</Button>
                            <Button size="sm" variant="ghost" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages || isLoading}>末页</Button>
                        </div>
                        <div className="hist-jump">
                            <span>跳至</span>
                            <Input
                                type="number"
                                min="1"
                                max={totalPages}
                                placeholder="页码"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const page = parseInt((e.target as HTMLInputElement).value);
                                        if (page >= 1 && page <= totalPages) {
                                            goToPage(page);
                                        }
                                    }
                                }}
                            />
                            <Button
                                size="sm"
                                onClick={() => {
                                    const input = document.querySelector('input[placeholder="页码"]') as HTMLInputElement;
                                    const page = parseInt(input.value);
                                    if (page >= 1 && page <= totalPages) {
                                        goToPage(page);
                                    }
                                }}
                            >
                                跳转
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            <div className="page-scroll">
                {isLoading ? (
                    <Empty title="加载中..." />
                ) : items.length === 0 ? (
                    <Empty
                        title="暂无生成记录"
                        description="在编辑器或实验室中生成图片会自动保存到这里"
                    />
                ) : (
                    <>
                        <div className="hist-grid">
                            {items.map(item => (
                                <Card
                                    key={item.id}
                                    mediaRatio="sq"
                                    onOpen={() => setLightbox(item)}
                                    media={(
                                        <>
                                            <img src={item.imageUrl} alt="" loading="lazy" />
                                            {isJpgDataUri(item.imageUrl) && <span className="jpg-mark">JPG</span>}
                                            <div className="card-hover-del" data-card-action>
                                                <IconButton size="sm" danger label="删除" onClick={(e) => handleDelete(item.id, e)}>✕</IconButton>
                                            </div>
                                            <div className="card-hover-time">{new Date(item.createdAt).toLocaleString()}</div>
                                        </>
                                    )}
                                />
                            ))}
                        </div>
                        <div className="hist-foot">
                            {isLoading ? (
                                <p>加载中...</p>
                            ) : (
                                <>
                                    <p>当前显示第 {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalCount)} - {Math.min(currentPage * PAGE_SIZE, totalCount)} 张</p>
                                    <p>共 {totalCount} 张，已缓存 {Object.keys(pageCache).length} 页</p>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            {lightbox && (
                <div className="lbx" onClick={() => setLightbox(null)}>
                    <div className="lbx-split glass-strong" onClick={e => e.stopPropagation()}>
                        <div className="lbx-media">
                            {previewJpgDataUri && !lightboxIsJpg ? (
                                <div className="compare-wrap">
                                    <div ref={previewLeftRef} className="compare-col">
                                        <div className="compare-label">原图 PNG（100%）</div>
                                        <img src={lightbox.imageUrl} className="block max-w-none h-auto" />
                                    </div>
                                    <div ref={previewRightRef} className="compare-col">
                                        <div className="compare-label jpg">预览 JPG q={lightboxQuality.toFixed(2)}（100%）</div>
                                        <img src={previewJpgDataUri} className="block max-w-none h-auto" />
                                    </div>
                                </div>
                            ) : (
                                <img src={lightbox.imageUrl} alt="" />
                            )}
                            {previewing && (
                                <div className="jpg-mark" style={{ top: 'auto', bottom: 8, right: 8, left: 'auto' }}>生成预览中...</div>
                            )}
                            {previewJpgDataUri && !lightboxIsJpg && (
                                <div className="jpg-mark" style={{ top: 'auto', bottom: 8, pointerEvents: 'none' }}>
                                    双列已同步滚动，拖动查看贴边 / 眼睛 / 纹理细节
                                </div>
                            )}
                        </div>

                        <div className="lbx-side">
                            <div className="pref-row" style={{ marginBottom: 12 }}>
                                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>图片详情</h2>
                                <IconButton label="关闭" onClick={() => setLightbox(null)}>✕</IconButton>
                            </div>

                            <div className="page-scroll" style={{ flex: 1 }}>
                                <ParamsViewer
                                    params={lightbox.params}
                                    prompt={lightbox.prompt}
                                    notify={notify}
                                />

                                {lightboxIsJpg ? (
                                    <div className="notice ok" style={{ marginTop: 12 }}>
                                        <div className="pref-row">
                                            <span className="jpg-mark" style={{ position: 'static' }}>JPG</span>
                                            <strong>此图已压缩</strong>
                                        </div>
                                        <p className="hint">下载后无法在外部工具中读取生成参数（应用内仍可查看上方的 Prompt / Params）。</p>
                                    </div>
                                ) : (
                                    <div className="slot-card surface" style={{ marginTop: 12 }}>
                                        <div className="pref-row">
                                            <label>压缩为 JPG</label>
                                            <span className="hint" style={{ fontFamily: 'var(--mono)' }}>{lightboxQuality.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            className="range"
                                            min="0.1"
                                            max="1"
                                            step="0.01"
                                            value={lightboxQuality}
                                            onChange={e => handleLightboxQualityChange(parseFloat(e.target.value))}
                                        />
                                        <Button block onClick={handleSingleCompact} disabled={singleCompacting}>
                                            {singleCompacting ? '压缩中...' : '压缩此图'}
                                        </Button>
                                        <p className="hint">原 PNG 将被替换为 JPG；下载后无法在外部工具读取生成参数。</p>
                                    </div>
                                )}
                            </div>

                            <div className="create-form" style={{ marginTop: 12 }}>
                                <Button
                                    block
                                    onClick={() => {
                                        const importData = {
                                            prompt: lightbox.prompt,
                                            negativePrompt: '',
                                            params: lightbox.params,
                                        };
                                        sessionStorage.setItem(IMPORT_SESSION_KEY, JSON.stringify(importData));
                                        setLightbox(null);
                                        notify('参数已准备就绪，正在跳转到编辑器...');
                                        onNavigateToPlayground?.();
                                    }}
                                >
                                    导入到编辑器
                                </Button>

                                <div className="notice mist">
                                    <h4>发布到灵感图库</h4>
                                    <div className="pref-row">
                                        <Input
                                            placeholder="为这张图取个标题..."
                                            value={publishTitle}
                                            onChange={e => setPublishTitle(e.target.value)}
                                        />
                                        <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
                                            {isPublishing ? '发布中' : '发布'}
                                        </Button>
                                    </div>
                                </div>
                                <a
                                    href={lightbox.imageUrl}
                                    download={getDownloadFilename(lightbox.imageUrl)}
                                    className="btn btn-secondary btn-block"
                                >
                                    下载{lightboxIsJpg ? ' JPG' : '原图'}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            <Sheet open={showCleanModal} onClose={() => setShowCleanModal(false)} title="确认清理">
                <p className="hint">
                    {cleanMode === 'days'
                        ? `将删除 ${cleanDays} 天前的 ${cleanPreviewCount} 张图片`
                        : `当前共 ${totalCount} 张，将删除 ${cleanPreviewCount} 张，只保留最近 ${cleanCount} 张`
                    }
                </p>
                <p className="hint" style={{ color: 'var(--danger)' }}>此操作无法恢复</p>
                {cleanMode === 'days' ? (
                    <Field label="天数">
                        <Input
                            type="number"
                            min="1"
                            value={cleanDays}
                            onChange={e => {
                                setCleanDays(Number(e.target.value));
                                localHistory.countOlderThan(Number(e.target.value)).then(setCleanPreviewCount);
                            }}
                        />
                    </Field>
                ) : (
                    <Field label="保留数量">
                        <Input
                            type="number"
                            min="1"
                            value={cleanCount}
                            onChange={e => {
                                setCleanCount(Number(e.target.value));
                                localHistory.getCount().then(count => {
                                    setCleanPreviewCount(Math.max(0, count - Number(e.target.value)));
                                });
                            }}
                        />
                    </Field>
                )}
                <div className="sheet-foot">
                    <Button variant="ghost" onClick={() => setShowCleanModal(false)}>取消</Button>
                    <Button variant="danger" onClick={handleCleanConfirm}>确认删除</Button>
                </div>
            </Sheet>

            <Sheet open={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="发布成功">
                <p className="hint">您的作品已添加到灵感图库，其他用户可以查看并引用您的 Prompt。</p>
                <div className="sheet-foot">
                    <Button onClick={() => setShowSuccessModal(false)}>确定</Button>
                </div>
            </Sheet>

            <Sheet open={showOnboarding} onClose={() => dismissOnboarding(false)} title="体积太大？试试自动 JPG 保存">
                <p className="hint">
                    开启后，新生成的图片在保存到本地前会先转码为 JPG（默认质量 0.85），通常能节省 50%–80% 空间。
                    应用内仍可查看完整的 Prompt 与生成参数。
                </p>
                <div className="notice warn">
                    想先看效果？点开任意一张历史图的详情，拖动 <strong>JPG 质量</strong> 滑块就能并排预览压缩前后的真实差异。
                </div>
                <div className="sheet-foot">
                    <Button variant="ghost" onClick={() => dismissOnboarding(false)}>暂不启用</Button>
                    <Button onClick={() => dismissOnboarding(true)}>启用</Button>
                </div>
            </Sheet>

            <Sheet open={showCompactConfirm} onClose={() => setShowCompactConfirm(false)} title="确认批量压缩">
                <p className="hint">
                    即将把 <strong>{pendingPngCount}</strong> 张未压缩的 PNG 重编码为 JPG，
                    质量 <strong>{readQuality().toFixed(2)}</strong>。已是 JPG 的项会自动跳过。
                </p>
                <div className="notice warn">压缩后的图片在外部工具中无法读取生成参数（本应用内不受影响）。</div>
                <div className="sheet-foot">
                    <Button variant="ghost" onClick={() => setShowCompactConfirm(false)}>取消</Button>
                    <Button onClick={handleConfirmBatchCompact}>开始压缩</Button>
                </div>
            </Sheet>

            {compactProgress && (
                <div className="lbx" style={{ zIndex: 110 }}>
                    <div className="surface-strong" style={{ width: 'min(420px, 92vw)', padding: 20, borderRadius: 'var(--r-lg)' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>正在压缩...</h3>
                        <div className="usage-bar" style={{ height: 8, marginBottom: 12 }}>
                            <i style={{ width: `${compactProgress.total === 0 ? 0 : (compactProgress.processed / compactProgress.total) * 100}%` }} />
                        </div>
                        <div className="create-form">
                            <div className="pref-row"><span>已处理</span><strong>{compactProgress.processed} / {compactProgress.total}</strong></div>
                            <div className="pref-row"><span>节省空间</span><strong>~{formatMB(compactProgress.savedBytes)} MB</strong></div>
                            <div className="pref-row"><span>失败</span><strong>{compactProgress.failed} 张</strong></div>
                            <div className="pref-row"><span>预计剩余</span><strong>{compactProgress.remainingSec}s</strong></div>
                        </div>
                        <Button variant="ghost" block style={{ marginTop: 14 }} onClick={handleCancelBatchCompact} disabled={compactCancelRef.current}>
                            {compactCancelRef.current ? '正在停止...' : '取消（当前张完成后停止）'}
                        </Button>
                    </div>
                </div>
            )}

            <Sheet open={!!compactSummary} onClose={() => setCompactSummary(null)} title="压缩完成">
                {compactSummary && (
                    <div className="create-form">
                        <div className="pref-row"><span>成功</span><strong>{compactSummary.success} 张</strong></div>
                        <div className="pref-row"><span>失败</span><strong>{compactSummary.failed} 张</strong></div>
                        <div className="pref-row"><span>节省总量</span><strong>~{formatMB(compactSummary.savedBytes)} MB</strong></div>
                        <div className="pref-row">
                            <span>压缩率</span>
                            <strong>
                                {compactSummary.originalTotal > 0
                                    ? `${Math.round((compactSummary.savedBytes / compactSummary.originalTotal) * 100)}%`
                                    : '—'}
                            </strong>
                        </div>
                    </div>
                )}
                <div className="sheet-foot">
                    <Button onClick={() => setCompactSummary(null)}>确定</Button>
                </div>
            </Sheet>
        </div>
    );
};
