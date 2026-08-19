
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Artist, User } from '../types';
import { generateImage } from '../services/naiService'; // Import generation service
import { api } from '../services/api'; // Import api for updating
import { db } from '../services/dbService'; // Import DB to fetch config
import { getApiKey, hasApiKey } from '../services/apiKeyStore';
import { ApiKeyBadge, ApiKeySheet, Button, Card, Chip, Empty, IconButton, Input, Seg, Sheet, Tag, Textarea, useApiKeyConfigured } from './ui';
import { ArtistLibraryConfig } from './ArtistLibraryConfig';
import { ArtistLibraryCart } from './ArtistLibraryCart';
import { cx } from './ui/cx';

const ICONS = {
    refresh: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
    grid: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h6v6H4zM14 6h6v6h-6zM4 16h6v6H4zM14 16h6v6h-6z" />
        </svg>
    ),
    list: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    ),
    star: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.563.044.8.77.38 1.178l-4.244 4.134a.563.563 0 00-.153.476l1.24 5.376c.13.565-.487 1.01-.967.756L12 18.232l-4.894 3.08c-.48.254-1.097-.19-.967-.756l1.24-5.376a.563.563 0 00-.153-.476L2.985 10.575c-.42-.408-.183-1.134.38-1.178l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
    ),
    zoom: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m-3-3h6" />
        </svg>
    ),
    ext: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
    ),
    bolt: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    plus: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

interface CartItem {
    name: string;
    weight: number; // step count: 0 normal, >0 strengthen, <0 weaken
}

type ArtistWeightSyntax = 'numeric' | 'bracket';

const ARTIST_WEIGHT_SYNTAX_KEY = 'naipm.artistLibrary.weightSyntax';
const ARTIST_WEIGHT_SYNTAX_CHANGE_EVENT = 'naipm-artist-weight-syntax-change';
const DEFAULT_ARTIST_WEIGHT_SYNTAX: ArtistWeightSyntax = 'numeric';
const ARTIST_WEIGHT_MIN_STEP = -10;
const ARTIST_WEIGHT_MAX_STEP = 10;
const ARTIST_WEIGHT_NUMERIC_STEP = 0.1;

const clampArtistWeightStep = (step: number) => {
    return Math.min(ARTIST_WEIGHT_MAX_STEP, Math.max(ARTIST_WEIGHT_MIN_STEP, step));
};

const getStoredArtistWeightSyntax = (): ArtistWeightSyntax => {
    const raw = localStorage.getItem(ARTIST_WEIGHT_SYNTAX_KEY);
    return raw === 'bracket' ? 'bracket' : DEFAULT_ARTIST_WEIGHT_SYNTAX;
};

const formatArtistTagWithWeight = (tag: string, step: number, syntax: ArtistWeightSyntax) => {
    const clampedStep = clampArtistWeightStep(step);
    if (clampedStep === 0) return tag;

    if (syntax === 'numeric') {
        const numericWeight = 1 + clampedStep * ARTIST_WEIGHT_NUMERIC_STEP;
        return `${numericWeight.toFixed(1)}::${tag}::`;
    }

    if (clampedStep > 0) return "{".repeat(clampedStep) + tag + "}".repeat(clampedStep);
    return "[".repeat(Math.abs(clampedStep)) + tag + "]".repeat(Math.abs(clampedStep));
};

const normalizeArtistTagName = (name: string) => {
    return name.replace(/^artist:/i, '').trim();
};

const parseNumericWeightedArtistTag = (raw: string): { name: string; step: number } | null => {
    const match = raw.match(/^([0-9]+(?:\.[0-9]+)?)::(.+)::$/);
    if (!match) return null;

    const numericWeight = parseFloat(match[1]);
    if (!Number.isFinite(numericWeight)) return null;

    const step = clampArtistWeightStep(Math.round((numericWeight - 1) / ARTIST_WEIGHT_NUMERIC_STEP));
    return { name: normalizeArtistTagName(match[2]), step };
};

interface ArtistLibraryProps {
    isDark: boolean;
    toggleTheme: () => void;
    // New props for caching
    artistsData: Artist[] | null;
    onRefresh: () => Promise<void>;
    notify: (msg: string, type?: 'success' | 'error') => void;
    currentUser?: User | null; // Add current user prop for permission check
}

// Helper to get first char
const getGroupChar = (name: string) => {
    const char = name.charAt(0).toUpperCase();
    return /[A-Z]/.test(char) ? char : '#';
};

const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Helper: Compress Base64 Image to JPEG
const compressImage = (base64: string, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(base64); // Fallback
                return;
            }
            // Fill white background for transparency safety
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            // Convert to JPEG with quality
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
        };
        img.onerror = (e) => reject(e);
        img.src = base64;
    });
};

// Lazy Loading Component
const LazyImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsLoaded(false); // Reset load state when src changes
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsInView(true);
                observer.disconnect();
            }
        }, { threshold: 0.1 });

        if (imgRef.current) observer.observe(imgRef.current);
        return () => observer.disconnect();
    }, [src]);

    return (
        <div ref={imgRef} className={cx('ph-media', className)}>
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

// --- Benchmark Config Interface ---
interface BenchmarkSlot {
    label: string;
    prompt: string;
}

interface BenchmarkConfig {
    slots: BenchmarkSlot[]; // Flexible slots
    negative: string;
    seed: number;
    steps: number;
    scale: number;
    interval?: number; // Added interval
}

const DEFAULT_BENCHMARK_CONFIG: BenchmarkConfig = {
    slots: [
        {
            label: "面部",
            prompt: "masterpiece, best quality, 1girl, solo,\ncowboy shot, slight tilt head, three-quarter view,\nhand on face, peace sign, index finger raised, (dynamic pose),\ndetailed face, detailed eyes, blushing, happy, open mouth,\nmessy hair, hair ornament,\nwhite shirt, collarbone,\nsimple background, soft lighting, "
        },
        {
            label: "体态",
            prompt: "masterpiece, best quality, 1girl, solo,\nkneeling, from above, looking at viewer,\nbikini, wet skin, long hair, medium breasts, soft shading, clear form, (detailed anatomy:1.1), extremely detailed figure, \nstomach, navel, cleavage, collarbone, beautiful hands,\nthighs, barefoot,\nbeach, ocean, cinematic lighting, detailed characters, amazing quality, very aesthetic, absurdres, high detail, ultra-detailed,"
        },
        {
            label: "场景",
            prompt: "masterpiece, best quality, 1girl, solo,\nfull body, walking, looking back,\nfantasy clothes, cape, armor, holding sword,\nwind, hair blowing, petals,\nruins, forest, overgrown, detailed background, depth of field,\ndappled sunlight, atmospheric, intricate details,"
        }
    ],
    negative: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, censorbar, mosaic, censoring, bar censor, convenient censoring, bad anatomy, bad hands, text, error, missing fingers, crop,",
    seed: -1, // Random
    steps: 28,
    scale: 6,
    interval: 3000 // Default 3s
};

// Queue Item Interface
interface GenTask {
    uniqueId: string;
    artistId: string;
    slot: number;
}

interface LogEntry {
    time: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export const ArtistLibrary: React.FC<ArtistLibraryProps> = ({ isDark, toggleTheme, artistsData, onRefresh, notify, currentUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [showFavOnly, setShowFavOnly] = useState(false);
    const [usePrefix, setUsePrefix] = useState(true);
    const [artistWeightSyntax, setArtistWeightSyntax] = useState<ArtistWeightSyntax>(DEFAULT_ARTIST_WEIGHT_SYNTAX);
    const [lightboxState, setLightboxState] = useState<{ artistIdx: number, slotIdx: number } | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    // New State for features
    const [history, setHistory] = useState<{ text: string, time: string }[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState('');
    const [gachaCount, setGachaCount] = useState(3);

    // Layout State
    const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

    // View Settings
    // Grid: Columns (3-15)
    const [gridCols, setGridCols] = useState(6);
    // List: Image Width (px)
    const [listImgWidth, setListImgWidth] = useState(128);

    // Benchmark / Preview Mode State
    const [viewMode, setViewMode] = useState<'original' | 'benchmark'>('original');
    const [activeSlot, setActiveSlot] = useState<number>(0); // Index of config.slots

    // Benchmark Settings
    const [showConfig, setShowConfig] = useState(false);
    const [config, setConfig] = useState<BenchmarkConfig>(DEFAULT_BENCHMARK_CONFIG);

    const keyConfigured = useApiKeyConfigured();
    const [keySheetOpen, setKeySheetOpen] = useState(false);

    // Check if current user is admin
    const isAdmin = currentUser?.role === 'admin';
    
    // Check if current user can manage artists (admin + vip)
    const canManageArtists = currentUser?.role ? ['admin', 'vip'].includes(currentUser.role) : false;

    // Queue System
    const [taskQueue, setTaskQueue] = useState<GenTask[]>([]);
    const [failedTasks, setFailedTasks] = useState<GenTask[]>([]); // New: Failed Queue
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentTask, setCurrentTask] = useState<GenTask | null>(null);

    // Logs System
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [showLogs, setShowLogs] = useState(false);

    // Load data & Config
    useEffect(() => {
        const savedFav = localStorage.getItem('nai_fav_artists');
        if (savedFav) setFavorites(new Set(JSON.parse(savedFav)));

        const savedPrefix = localStorage.getItem('nai_use_prefix');
        if (savedPrefix !== null) setUsePrefix(savedPrefix === 'true');

        setArtistWeightSyntax(getStoredArtistWeightSyntax());

        const savedHistory = localStorage.getItem('nai_copy_history');
        if (savedHistory) setHistory(JSON.parse(savedHistory));

        // Load Config from Server (Public)
        db.getBenchmarkConfig().then(cfg => {
            if (cfg) setConfig(cfg);
        }).catch(err => {
            console.error("Failed to load benchmark config from server", err);
            // Fallback to local storage if server fails (backward compat)
            const savedConfig = localStorage.getItem('nai_benchmark_config');
            if (savedConfig) {
                try {
                    const parsed = JSON.parse(savedConfig);
                    if (!parsed.slots || parsed.slots.length === 0) parsed.slots = DEFAULT_BENCHMARK_CONFIG.slots;
                    setConfig(parsed);
                } catch (e) { }
            }
        });

        const handleArtistWeightSyntaxChange = () => {
            setArtistWeightSyntax(getStoredArtistWeightSyntax());
        };
        const handleArtistWeightSyntaxStorage = (event: StorageEvent) => {
            if (event.key === ARTIST_WEIGHT_SYNTAX_KEY) {
                setArtistWeightSyntax(getStoredArtistWeightSyntax());
            }
        };
        window.addEventListener(ARTIST_WEIGHT_SYNTAX_CHANGE_EVENT, handleArtistWeightSyntaxChange);
        window.addEventListener('storage', handleArtistWeightSyntaxStorage);

        return () => {
            window.removeEventListener(ARTIST_WEIGHT_SYNTAX_CHANGE_EVENT, handleArtistWeightSyntaxChange);
            window.removeEventListener('storage', handleArtistWeightSyntaxStorage);
        };
    }, []);

    const handleRefresh = async () => {
        setIsLoading(true);
        await onRefresh();
        setIsLoading(false);
    };

    const addToHistory = (text: string) => {
        const newEntry = { text, time: new Date().toLocaleTimeString() };
        const newHistory = [newEntry, ...history.filter(h => h.text !== text)].slice(30);
        setHistory(newHistory);
        localStorage.setItem('nai_copy_history', JSON.stringify(newHistory));
    };

    const toggleFav = (name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newFav = new Set(favorites);
        if (newFav.has(name)) newFav.delete(name);
        else newFav.add(name);
        setFavorites(newFav);
        localStorage.setItem('nai_fav_artists', JSON.stringify(Array.from(newFav)));
    };

    const toggleCart = (name: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (cart.find(i => i.name === name)) {
            setCart(cart.filter(i => i.name !== name));
        } else {
            setCart([...cart, { name, weight: 0 }]);
        }
    };

    const updateWeight = (index: number, delta: number) => {
        const newCart = [...cart];
        newCart[index].weight = clampArtistWeightStep(newCart[index].weight + delta);
        setCart(newCart);
    };

    const formatTag = (item: CartItem) => {
        const tag = (usePrefix ? 'artist:' : '') + item.name;
        return formatArtistTagWithWeight(tag, item.weight, artistWeightSyntax);
    };

    const copyCart = () => {
        const str = cart.map(formatTag).join(', ');
        navigator.clipboard.writeText(str);
        addToHistory(str);
        notify('组合串已复制！');
    };

    // MEMOIZED Filtered Artists to prevent stutter during layout changes
    const filteredArtists = useMemo(() => {
        return (artistsData || []).filter(a => {
            if (showFavOnly && !favorites.has(a.name)) return false;
            if (searchTerm) return a.name.toLowerCase().includes(searchTerm.toLowerCase());
            return true;
        });
    }, [artistsData, showFavOnly, favorites, searchTerm]);

    // --- New Features Logic ---

    const gacha = () => {
        if (!artistsData) return;
        const pool = showFavOnly ? artistsData.filter(a => favorites.has(a.name)) : artistsData;
        if (pool.length === 0) return;

        // Pick random count
        const count = Math.min(Math.max(1, gachaCount), 50);
        const newCart = [...cart];

        for (let i = 0; i < count; i++) {
            const randomArtist = pool[Math.floor(Math.random() * pool.length)];
            if (!newCart.find(c => c.name === randomArtist.name)) {
                newCart.push({ name: randomArtist.name, weight: 0 });
            }
        }
        setCart(newCart);
    };

    const handleImport = () => {
        const tags = importText.split(/[,，\n]/).map(s => s.trim()).filter(s => s);
        const newItems: CartItem[] = [];

        tags.forEach(raw => {
            const numericParsed = parseNumericWeightedArtistTag(raw);
            let name = numericParsed ? numericParsed.name : normalizeArtistTagName(raw);
            let weight = numericParsed ? numericParsed.step : 0;

            if (!numericParsed) {
                // Simple brace counting
                const openBraces = (name.match(/\{/g) || []).length;
                const closeBraces = (name.match(/\}/g) || []).length;
                const openBrackets = (name.match(/\[/g) || []).length;
                const closeBrackets = (name.match(/\]/g) || []).length;

                if (openBraces > 0 && openBraces === closeBraces) {
                    weight = clampArtistWeightStep(openBraces);
                    name = normalizeArtistTagName(name.replace(/[\{\}]/g, ''));
                } else if (openBrackets > 0 && openBrackets === closeBrackets) {
                    weight = clampArtistWeightStep(-openBrackets);
                    name = normalizeArtistTagName(name.replace(/[\[\]]/g, ''));
                }
            }

            // Match with known artists
            const matched = (artistsData || []).find(a => a.name.toLowerCase() === name.toLowerCase());
            if (matched) {
                // Avoid duplicates in batch
                if (!newItems.find(i => i.name === matched.name)) {
                    newItems.push({ name: matched.name, weight });
                }
            }
        });

        // Merge with cart
        const finalCart = [...cart];
        newItems.forEach(item => {
            if (!finalCart.find(c => c.name === item.name)) {
                finalCart.push(item);
            }
        });
        setCart(finalCart);
        setShowImport(false);
        setImportText('');
        notify(`已导入 ${newItems.length} 位画师`);
    };

    const scrollToLetter = (char: string) => {
        // Scroll within the container instead of window to avoid hiding toolbar
        const container = scrollContainerRef.current;
        if (!container) return;

        const el = document.getElementById(`anchor-${char}`);
        if (el) {
            // Calculate offset relative to container
            const topPos = el.offsetTop - container.offsetTop;
            container.scrollTo({ top: topPos, behavior: 'smooth' });
        }
    };

    // --- Config Modal Logic (Refactored to separate component) ---
    const saveConfig = async (newConfig: BenchmarkConfig) => {
        // Basic validation
        if (newConfig.slots.length === 0) {
            notify('至少需要一个测试分组', 'error');
            return;
        }
        // Apply Draft to Real Config & Save to Server
        setConfig(newConfig);

        try {
            await db.saveBenchmarkConfig(newConfig);
            notify('配置已保存 (同步至云端)');
        } catch (e) {
            console.error(e);
            notify('保存失败，仅本地生效', 'error');
            localStorage.setItem('nai_benchmark_config', JSON.stringify(newConfig)); // Fallback
        }

        // Safety: if active slot was deleted, reset to 0
        if (activeSlot >= newConfig.slots.length) {
            setActiveSlot(0);
        }

        setShowConfig(false);
    };

    // Helper Log
    const addLog = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
        const entry: LogEntry = {
            time: new Date().toLocaleTimeString(),
            message: msg,
            type
        };
        setLogs(prev => [entry, ...prev].slice(0, 100)); // Keep last 100 logs
        console.log(`[Queue] ${msg}`);
    };

    // --- Queue Processor ---
    useEffect(() => {
        const processNext = async () => {
            // Check Pause state
            if (isProcessing || taskQueue.length === 0 || isPaused) return;

            // Delay to prevent 429 (Throttle)
            setIsProcessing(true);
            // Use configured interval, default to 2000ms if missing
            const delay = config.interval && config.interval > 500 ? config.interval : 2000;
            await new Promise(res => setTimeout(res, delay));

            const task = taskQueue[0];
            setCurrentTask(task);

            try {
                // Find the artist info
                const artist = artistsData?.find(a => a.id === task.artistId);
                if (!artist) {
                    throw new Error(`Artist ID ${task.artistId} not found`);
                }

                // Actual generation Logic
                const slot = config.slots[task.slot];
                if (!slot) throw new Error(`Slot config missing for index ${task.slot}`);

                const slotPrompt = slot.prompt;
                const prompt = `artist:${artist.name}, ${slotPrompt}`;
                const negative = config.negative;
                // Pass -1 (Random) or configured seed
                const seed = config.seed;

                // Generate
                const result = await generateImage(getApiKey(), prompt, negative, {
                    width: 832, height: 1216, steps: config.steps, scale: config.scale, sampler: 'k_euler_ancestral', seed: seed,
                    qualityToggle: true, ucPreset: 0
                });

                // Compress before upload (Save Space!)
                const compressedImg = await compressImage(result.image, 0.8);

                // Construct update payload
                // Fetch FRESH benchmarks from current state to avoid overwrites if multiple tasks ran
                const currentBenchmarks = artist.benchmarks ? [...artist.benchmarks] : (artist.previewUrl ? [artist.previewUrl] : []);

                // Pad array if needed
                while (currentBenchmarks.length <= task.slot) currentBenchmarks.push("");
                currentBenchmarks[task.slot] = compressedImg;

                await api.post('/artists', {
                    id: artist.id,
                    name: artist.name,
                    imageUrl: artist.imageUrl,
                    previewUrl: artist.previewUrl,
                    benchmarks: currentBenchmarks
                });

                // Refresh UI
                await onRefresh();
                addLog(`Generated & Compressed: ${artist.name} (Slot ${task.slot + 1})`, 'success');

            } catch (err: any) {
                const errMsg = err.message || JSON.stringify(err);
                const is429 = errMsg.includes('429') || errMsg.includes('Concurrent') || errMsg.includes('locked');

                if (is429) {
                    addLog('Rate Limit (429) detected. Cooling down for 60s...', 'error');
                    await new Promise(res => setTimeout(res, 60000));
                }

                const artistName = artistsData?.find(a => a.id === task.artistId)?.name || 'Unknown';
                const logMsg = is429
                    ? `Rate Limit (429) for ${artistName}. Task moved to Retry Queue.`
                    : `Failed: ${artistName} - ${errMsg}`;

                addLog(logMsg, 'error');

                // Move to Failed Queue instead of discarding
                setFailedTasks(prev => [...prev, task]);

                if (!is429) {
                    notify(`生成失败: ${artistName}`, 'error');
                }
            } finally {
                // Remove done task and loop
                setTaskQueue(prev => prev.slice(1));
                setCurrentTask(null);
                setIsProcessing(false);
            }
        };

        processNext();
    }, [taskQueue, isProcessing, isPaused, config, artistsData, onRefresh, notify]);

    // (The rest of the file remains unchanged, omitted for brevity as per instructions to only include changes if possible, but minimal diff implies keeping context if necessary. I'll include the rest to be safe and runnable)
    // ... (Code for queueGeneration, retryFailedTasks, queueMissingGenerations, lightbox logic, etc.)

    // Add tasks to queue
    const queueGeneration = (artist: Artist, slots: number[], e: React.MouseEvent) => {
        e.stopPropagation();
        if (!hasApiKey()) {
            notify('请先配置 API Key', 'error');
            setKeySheetOpen(true);
            return;
        }

        const newTasks = slots.map(s => ({
            uniqueId: crypto.randomUUID(),
            artistId: artist.id,
            slot: s
        }));

        setTaskQueue(prev => [...prev, ...newTasks]);
        notify(`已添加 ${newTasks.length} 个任务到队列`);
    };

    const retryFailedTasks = () => {
        if (failedTasks.length === 0) return;
        setTaskQueue(prev => [...prev, ...failedTasks]);
        setFailedTasks([]);
        addLog(`Retrying ${failedTasks.length} failed tasks`, 'info');
        notify(`已重新加入 ${failedTasks.length} 个失败任务`);
    };

    const queueMissingGenerations = () => {
        if (!hasApiKey()) {
            notify('请先配置 API Key', 'error');
            setKeySheetOpen(true);
            return;
        }

        const newTasks: GenTask[] = [];
        let existsCount = 0;

        // Determine target slots to check
        // If List mode, check ALL slots. If Grid mode, only check activeSlot.
        const targetSlots = layoutMode === 'list'
            ? config.slots.map((_, i) => i)
            : [activeSlot];

        // Scan currently filtered list
        for (const artist of filteredArtists) {
            for (const slotIndex of targetSlots) {
                // Check if image exists for slotIndex
                let hasImage = false;
                if (slotIndex === 0) {
                    // Slot 0: Check benchmark[0] OR legacy previewUrl
                    if (artist.previewUrl) hasImage = true;
                    else if (artist.benchmarks && artist.benchmarks[0]) hasImage = true;
                } else {
                    // Other slots: Check benchmark[slotIndex]
                    if (artist.benchmarks && artist.benchmarks[slotIndex]) hasImage = true;
                }

                if (!hasImage) {
                    // Check if already queued
                    const isQueued = taskQueue.some(t => t.artistId === artist.id && t.slot === slotIndex) ||
                        failedTasks.some(t => t.artistId === artist.id && t.slot === slotIndex) ||
                        (currentTask?.artistId === artist.id && currentTask?.slot === slotIndex);

                    if (!isQueued) {
                        newTasks.push({
                            uniqueId: crypto.randomUUID(),
                            artistId: artist.id,
                            slot: slotIndex
                        });
                    } else {
                        existsCount++;
                    }
                }
            }
        }

        if (newTasks.length === 0) {
            if (existsCount > 0) notify('缺失项已在队列中', 'error');
            else notify('当前列表无缺失项', 'success');
            return;
        }

        setTaskQueue(prev => [...prev, ...newTasks]);
        notify(`已添加 ${newTasks.length} 个补全任务`);
    };

    // --- Lightbox Navigation Logic ---
    const navigateLightbox = useCallback((direction: 'next' | 'prev') => {
        setLightboxState(current => {
            if (!current) return null;
            let { artistIdx, slotIdx } = current;
            const totalArtists = filteredArtists.length;
            const totalSlots = config.slots.length;

            if (layoutMode === 'grid') {
                // Grid Mode: Iterate Artists, Keep Slot Context
                // If we are in 'original' view, keep slotIdx as -1.
                // If we are in 'benchmark' view, keep slotIdx as current (usually activeSlot, which is handled by setLightboxState logic)
                if (direction === 'next') {
                    artistIdx = (artistIdx + 1) % totalArtists;
                } else {
                    artistIdx = (artistIdx - 1 + totalArtists) % totalArtists;
                }
            } else {
                // List Mode: Iterate Slots then Artists
                if (direction === 'next') {
                    if (slotIdx < totalSlots - 1) {
                        slotIdx++;
                    } else {
                        artistIdx = (artistIdx + 1) % totalArtists;
                        slotIdx = -1; // Reset to Original of next artist
                    }
                } else {
                    if (slotIdx > -1) {
                        slotIdx--;
                    } else {
                        artistIdx = (artistIdx - 1 + totalArtists) % totalArtists;
                        slotIdx = totalSlots - 1; // Go to last slot of prev artist
                    }
                }
            }
            return { artistIdx, slotIdx };
        });
    }, [filteredArtists.length, config.slots.length, layoutMode]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxState) return;
            if (e.key === 'ArrowRight') navigateLightbox('next');
            if (e.key === 'ArrowLeft') navigateLightbox('prev');
            if (e.key === 'Escape') setLightboxState(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxState, navigateLightbox]);

    // Helper to get current lightbox image details
    const currentLightboxImage = useMemo(() => {
        if (!lightboxState) return null;
        const artist = filteredArtists[lightboxState.artistIdx];
        if (!artist) return null;

        const { slotIdx } = lightboxState;
        if (slotIdx === -1) {
            return { src: artist.imageUrl, name: artist.name };
        }
        // Fallback logic for slot 0 to use legacy previewUrl if benchmark array is empty
        const src = artist.benchmarks?.[slotIdx] || (slotIdx === 0 ? artist.previewUrl : null);
        const slotName = config.slots[slotIdx]?.label || `Slot ${slotIdx + 1}`;

        return { src, name: `${artist.name} - ${slotName}` };
    }, [lightboxState, filteredArtists, config.slots]);


    return (
        <div className="page-fill">
            <header className="board-head arsenal-head">
                <div className="board-head-top">
                    <div>
                        <h1>军火库</h1>
                    </div>
                    <div className="board-tools">
                        {canManageArtists && (
                            <IconButton label="刷新画师列表" onClick={handleRefresh}>
                                <span className={isLoading ? 'is-spin' : undefined}>{ICONS.refresh}</span>
                            </IconButton>
                        )}
                        <Seg<'grid' | 'list'>
                            aria-label="布局"
                            value={layoutMode}
                            onChange={setLayoutMode}
                            options={[
                                { value: 'grid', label: '网格' },
                                { value: 'list', label: '展开' },
                            ]}
                        />
                    </div>
                </div>
                <div className="board-tools">
                    <Input
                        type="text"
                        className="board-search"
                        placeholder="搜索 / 粘贴 Prompt..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        aria-label="搜索画师"
                    />
                    <div className="arsenal-zoom">
                        <span>{layoutMode === 'grid' ? `列:${gridCols}` : `宽:${listImgWidth}`}</span>
                        {layoutMode === 'grid' ? (
                            <input
                                type="range"
                                className="range"
                                min="3" max="15" step="1"
                                value={gridCols}
                                onChange={(e) => setGridCols(parseInt(e.target.value))}
                                title="调整每行显示的列数 (3-15)"
                            />
                        ) : (
                            <input
                                type="range"
                                className="range"
                                min="80" max="400" step="10"
                                value={listImgWidth}
                                onChange={(e) => setListImgWidth(parseInt(e.target.value))}
                                title="调整实装图宽度 (80-400px)"
                            />
                        )}
                    </div>
                    {layoutMode === 'grid' && (
                        <Seg<'original' | 'benchmark'>
                            aria-label="显示图"
                            value={viewMode}
                            onChange={setViewMode}
                            options={[
                                { value: 'original', label: '原图' },
                                { value: 'benchmark', label: '实装' },
                            ]}
                        />
                    )}
                    <ApiKeyBadge configured={keyConfigured} onClick={() => setKeySheetOpen(true)} />
                    <IconButton label="配置分组" onClick={() => setShowConfig(true)}>⚙️</IconButton>
                    {layoutMode === 'grid' && viewMode === 'benchmark' && config.slots.map((slot, index) => (
                        <Chip
                            key={index}
                            active={activeSlot === index}
                            onClick={() => setActiveSlot(index)}
                            title={slot.prompt}
                        >
                            {index + 1}. {slot.label}
                        </Chip>
                    ))}
                    {isAdmin && (layoutMode === 'list' || viewMode === 'benchmark') && keyConfigured && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={queueMissingGenerations}
                            title={layoutMode === 'list'
                                ? "一键补全当前列表中所有画师的所有缺失槽位"
                                : `一键补全当前列表中缺失 "Slot ${activeSlot + 1}: ${config.slots[activeSlot]?.label}" 的画师`
                            }
                        >
                            {ICONS.plus}
                            补全
                        </Button>
                    )}
                    {(taskQueue.length > 0 || failedTasks.length > 0 || logs.length > 0) && (
                        <div
                            className={cx('queue-chip', failedTasks.length > 0 && 'fail')}
                            onClick={() => setShowLogs(true)}
                            title="点击查看生成日志"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowLogs(true); }}
                        >
                            <span>Wait:{taskQueue.length}{failedTasks.length > 0 ? ` | Fail:${failedTasks.length}` : ''}</span>
                            <IconButton
                                size="sm"
                                label={isPaused ? '恢复队列' : '暂停队列'}
                                onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
                            >
                                {isPaused ? '▶' : '❚❚'}
                            </IconButton>
                            {isProcessing && !isPaused && <i className="dot-live" />}
                        </div>
                    )}
                    <Chip onClick={() => setShowImport(true)} title="批量导入">📥</Chip>
                    <Chip active={showHistory} onClick={() => setShowHistory(!showHistory)} title="历史记录">🕒</Chip>
                    <Chip
                        active={showFavOnly}
                        onClick={() => setShowFavOnly(!showFavOnly)}
                        title="收藏"
                        aria-label="仅显示收藏"
                    >
                        {ICONS.star}
                    </Chip>
                </div>
            </header>

            <nav className="arsenal-az glass" aria-label="字母索引">
                {ALPHABET.map(char => (
                    <button
                        key={char}
                        type="button"
                        onClick={() => scrollToLetter(char)}
                    >
                        {char}
                    </button>
                ))}
            </nav>

            <div ref={scrollContainerRef} className="page-scroll arsenal-body">
                {isLoading && (
                    <div className="queue-mask" style={{ position: 'absolute' }}>
                        <span className="is-spin">{ICONS.refresh}</span>
                    </div>
                )}

                {filteredArtists.length === 0 ? (
                    <Empty title="暂无画师" description={showFavOnly ? '收藏夹是空的。' : '没有匹配的画师。'} />
                ) : layoutMode === 'grid' ? (
                    <div
                        className="arsenal-grid"
                        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
                    >
                        {filteredArtists.map((artist, idx) => {
                            const isSelected = !!cart.find(c => c.name === artist.name);
                            const isFav = favorites.has(artist.name);
                            const prevChar = idx > 0 ? getGroupChar(filteredArtists[idx - 1].name) : '';
                            const currChar = getGroupChar(artist.name);
                            const isAnchor = currChar !== prevChar;
                            let displayImg = artist.imageUrl;
                            let isBenchmarkMissing = false;

                            if (viewMode === 'benchmark') {
                                if (artist.benchmarks && artist.benchmarks[activeSlot]) {
                                    displayImg = artist.benchmarks[activeSlot];
                                } else if (activeSlot === 0 && artist.previewUrl) {
                                    displayImg = artist.previewUrl;
                                } else {
                                    isBenchmarkMissing = true;
                                }
                            }

                            const isTaskPending = taskQueue.some(t => t.artistId === artist.id);
                            const isTaskRunning = currentTask?.artistId === artist.id;
                            const isTaskFailed = failedTasks.some(t => t.artistId === artist.id);

                            return (
                                <Card
                                    key={artist.id}
                                    className={cx('arsenal-card', isSelected && 'is-picked')}
                                    mediaRatio="portrait"
                                    onOpen={() => toggleCart(artist.name)}
                                    media={(
                                        <>
                                            <div id={isAnchor ? `anchor-${currChar}` : undefined} />
                                            {!isBenchmarkMissing ? (
                                                <LazyImage src={displayImg} alt={artist.name} />
                                            ) : (
                                                <div className="ph-miss">
                                                    <span>🤖</span>
                                                    <span>No Data</span>
                                                </div>
                                            )}
                                            {(isTaskPending || isTaskRunning || isTaskFailed) && (
                                                <div className="queue-mask">
                                                    {isTaskRunning ? (
                                                        <span className="is-spin">{ICONS.refresh}</span>
                                                    ) : isTaskFailed ? (
                                                        <Tag tone="warn">Failed</Tag>
                                                    ) : (
                                                        <Tag>Queue</Tag>
                                                    )}
                                                </div>
                                            )}
                                            <div className="media-actions" data-card-action onClick={e => e.stopPropagation()}>
                                                <IconButton
                                                    size="sm"
                                                    label={isFav ? '取消收藏' : '收藏'}
                                                    className={isFav ? 'is-fav' : undefined}
                                                    onClick={(e) => toggleFav(artist.name, e)}
                                                >
                                                    {ICONS.star}
                                                </IconButton>
                                                <a
                                                    href={`https://danbooru.donmai.us/posts?tags=${artist.name}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="icon-btn sm"
                                                    aria-label={`在 Danbooru 打开 ${artist.name}`}
                                                >
                                                    {ICONS.ext}
                                                </a>
                                                <IconButton
                                                    size="sm"
                                                    label="查看大图"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const slot = viewMode === 'benchmark' ? activeSlot : -1;
                                                        setLightboxState({ artistIdx: idx, slotIdx: slot });
                                                    }}
                                                >
                                                    {ICONS.zoom}
                                                </IconButton>
                                                {isAdmin && viewMode === 'benchmark' && keyConfigured && (
                                                    <>
                                                        <IconButton
                                                            size="sm"
                                                            label={`生成当前组 (Slot ${activeSlot + 1})`}
                                                            onClick={(e) => queueGeneration(artist, [activeSlot], e)}
                                                        >
                                                            {ICONS.bolt}
                                                        </IconButton>
                                                        <IconButton
                                                            size="sm"
                                                            label={`一键生成全部 ${config.slots.length} 组`}
                                                            onClick={(e) => queueGeneration(artist, config.slots.map((_, i) => i), e)}
                                                        >
                                                            {ICONS.plus}
                                                        </IconButton>
                                                    </>
                                                )}
                                            </div>
                                            {isSelected && <div className="pick-mark"><i>✓</i></div>}
                                        </>
                                    )}
                                    title={artist.name}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="arsenal-list">
                        {filteredArtists.map((artist, idx) => {
                            const isSelected = !!cart.find(c => c.name === artist.name);
                            const isFav = favorites.has(artist.name);
                            const prevChar = idx > 0 ? getGroupChar(filteredArtists[idx - 1].name) : '';
                            const currChar = getGroupChar(artist.name);
                            const isAnchor = currChar !== prevChar;

                            return (
                                <div
                                    key={artist.id}
                                    id={isAnchor ? `anchor-${currChar}` : undefined}
                                    className={cx('arsenal-row', 'surface', isSelected && 'is-picked')}
                                    onClick={() => toggleCart(artist.name)}
                                >
                                    <div className="arsenal-row-head">
                                        <div className="card-extra">
                                            <h3 className={isSelected ? 'is-picked' : undefined}>{artist.name}</h3>
                                            <IconButton
                                                size="sm"
                                                label={isFav ? '取消收藏' : '收藏'}
                                                className={isFav ? 'is-fav' : undefined}
                                                onClick={(e) => toggleFav(artist.name, e)}
                                            >
                                                {ICONS.star}
                                            </IconButton>
                                            <a
                                                href={`https://danbooru.donmai.us/posts?tags=${artist.name}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="icon-btn sm"
                                                aria-label={`在 Danbooru 打开 ${artist.name}`}
                                            >
                                                {ICONS.ext}
                                            </a>
                                        </div>
                                        {isAdmin && keyConfigured && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={(e) => queueGeneration(artist, config.slots.map((_, i) => i), e)}
                                                title="生成所有实装"
                                            >
                                                {ICONS.bolt}
                                                Generate All
                                            </Button>
                                        )}
                                    </div>
                                    <div className="arsenal-slots">
                                        <div className="arsenal-slot" style={{ width: `${listImgWidth}px` }}>
                                            <div className="slot-frame" onClick={(e) => { e.stopPropagation(); setLightboxState({ artistIdx: idx, slotIdx: -1 }); }}>
                                                <LazyImage src={artist.imageUrl} alt="原图" />
                                            </div>
                                            <span>原图</span>
                                        </div>

                                        {config.slots.map((slot, i) => {
                                            const img = artist.benchmarks?.[i];
                                            const taskRunning = currentTask?.artistId === artist.id && currentTask?.slot === i;
                                            const taskPending = taskQueue.some(t => t.artistId === artist.id && t.slot === i);
                                            const taskFailed = failedTasks.some(t => t.artistId === artist.id && t.slot === i);
                                            const displayImg = img || (i === 0 ? artist.previewUrl : null);

                                            return (
                                                <div
                                                    key={i}
                                                    className="arsenal-slot"
                                                    style={{ width: `${listImgWidth}px` }}
                                                >
                                                    <div className="slot-frame">
                                                        {displayImg ? (
                                                            <div onClick={(e) => { e.stopPropagation(); setLightboxState({ artistIdx: idx, slotIdx: i }); }}>
                                                                <LazyImage src={displayImg} alt={slot.label} />
                                                            </div>
                                                        ) : (
                                                            <div className="ph-miss">?</div>
                                                        )}
                                                        {(taskPending || taskRunning || taskFailed) && (
                                                            <div className="queue-mask">
                                                                {taskRunning ? (
                                                                    <span className="is-spin">{ICONS.refresh}</span>
                                                                ) : taskFailed ? (
                                                                    <Tag tone="warn">Failed</Tag>
                                                                ) : (
                                                                    <Tag>Queue</Tag>
                                                                )}
                                                            </div>
                                                        )}
                                                        {isAdmin && keyConfigured && !taskRunning && !taskPending && (
                                                            <div className="media-actions" style={{ bottom: 4, top: 'auto' }}>
                                                                <IconButton
                                                                    size="sm"
                                                                    label={`生成 ${slot.label}`}
                                                                    onClick={(e) => queueGeneration(artist, [i], e)}
                                                                >
                                                                    {ICONS.bolt}
                                                                </IconButton>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span title={slot.label}>{slot.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <ArtistLibraryCart
                cart={cart}
                setCart={setCart}
                updateWeight={updateWeight}
                toggleCart={toggleCart}
                copyCart={copyCart}
                formatTag={formatTag}
                weightSyntax={artistWeightSyntax}
            />

            {currentLightboxImage && (
                <div className="lbx" onClick={() => setLightboxState(null)}>
                    <button type="button" className="lbx-nav prev" onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }} aria-label="上一张">‹</button>
                    <div onClick={(e) => e.stopPropagation()}>
                        <img
                            src={currentLightboxImage.src}
                            alt={currentLightboxImage.name}
                            onClick={() => setLightboxState(null)}
                        />
                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                            <h3>{currentLightboxImage.name}</h3>
                        </div>
                    </div>
                    <button type="button" className="lbx-nav next" onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }} aria-label="下一张">›</button>
                    <IconButton className="lbx-close" label="关闭" onClick={() => setLightboxState(null)}>✕</IconButton>
                </div>
            )}

            <Sheet open={showHistory} onClose={() => setShowHistory(false)} title="复制历史">
                {history.length === 0 ? (
                    <Empty title="暂无历史" />
                ) : (
                    <div className="log-list">
                        {history.map((h, i) => (
                            <button
                                type="button"
                                key={i}
                                className="log-item info"
                                onClick={() => { navigator.clipboard.writeText(h.text); notify('已复制'); }}
                            >
                                <div className="copy-check-mono">{h.text}</div>
                                <div className="hint" style={{ textAlign: 'right', marginTop: 6 }}>{h.time}</div>
                            </button>
                        ))}
                    </div>
                )}
                <div className="sheet-foot">
                    <Button variant="ghost" onClick={() => { setHistory([]); localStorage.setItem('nai_copy_history', '[]'); }}>清空历史</Button>
                </div>
            </Sheet>

            <Sheet open={showLogs} onClose={() => setShowLogs(false)} title="任务日志">
                {failedTasks.length > 0 && (
                    <div className="notice danger" style={{ marginBottom: 12 }}>
                        <div className="pref-row">
                            <strong>{failedTasks.length} 个任务失败</strong>
                            <Button variant="danger" size="sm" onClick={retryFailedTasks}>重试所有失败任务</Button>
                        </div>
                    </div>
                )}
                <div className="log-list">
                    {logs.length === 0 && <Empty title="暂无日志" />}
                    {logs.map((log, i) => (
                        <div key={i} className={cx('log-item', log.type)}>
                            <span className="hint">[{log.time}] </span>
                            {log.message}
                        </div>
                    ))}
                </div>
            </Sheet>

            <Sheet open={showImport} onClose={() => setShowImport(false)} title="批量导入画师">
                <Textarea
                    placeholder="例如：artist:wlop, {artist:nixeu}, [[shaluo]]"
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                    rows={6}
                />
                <div className="sheet-foot">
                    <Button variant="ghost" onClick={() => setShowImport(false)}>取消</Button>
                    <Button onClick={handleImport}>导入</Button>
                </div>
            </Sheet>

            <ArtistLibraryConfig
                show={showConfig}
                onClose={() => setShowConfig(false)}
                onSave={saveConfig}
                initialConfig={config}
                notify={notify}
            />
            <ApiKeySheet open={keySheetOpen} onClose={() => setKeySheetOpen(false)} />
        </div>
    );
};
