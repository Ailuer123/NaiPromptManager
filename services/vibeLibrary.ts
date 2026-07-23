import type { VibePreset } from '../types';

const DEFAULT_DB_NAME = 'NAI_Vibe_DB';
const DB_VERSION = 1;
const STORE_NAME = 'presets';

export class VibeLibrary {
  private dbPromise?: Promise<IDBDatabase>;

  constructor(private readonly dbName = DEFAULT_DB_NAME) {}

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    const promise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`无法打开 Vibe 本地库：${request.error?.message ?? '未知错误'}`));
      request.onblocked = () => reject(new Error('Vibe 本地库正在被其他页面占用，请关闭其他页面后重试'));
    });

    // 打开失败后清空缓存，允许后续重试
    this.dbPromise = promise;
    promise.catch(() => {
      if (this.dbPromise === promise) this.dbPromise = undefined;
    });

    return promise;
  }

  private async request<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await this.open();

    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const request = operation(transaction.objectStore(STORE_NAME));
      let result: T;

      request.onsuccess = () => {
        result = request.result;
      };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(new Error(`Vibe 本地库操作失败：${transaction.error?.message ?? '未知错误'}`));
      transaction.onabort = () => reject(new Error(`Vibe 本地库操作已中止：${transaction.error?.message ?? '未知错误'}`));
    });
  }

  async list(): Promise<VibePreset[]> {
    const presets = await this.request<VibePreset[]>('readonly', store => store.getAll());
    return presets.sort((left, right) => right.createdAt - left.createdAt);
  }

  get(id: string): Promise<VibePreset | undefined> {
    return this.request<VibePreset | undefined>('readonly', store => store.get(id));
  }

  async put(preset: VibePreset): Promise<void> {
    await this.request<IDBValidKey>('readwrite', store => store.put(preset));
  }

  async delete(id: string): Promise<void> {
    await this.request<undefined>('readwrite', store => store.delete(id));
  }

  async clear(): Promise<void> {
    await this.request<undefined>('readwrite', store => store.clear());
  }
}

export const vibeLibrary = new VibeLibrary();
