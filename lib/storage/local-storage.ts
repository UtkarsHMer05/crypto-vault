/**
 * Local storage fallback for development without AWS/GCP
 */

interface StoredFile {
    key: string;
    data: string;
    metadata: Record<string, string>;
    uploadedAt: string;
    size: number;
}

interface StorageIndex {
    files: Record<string, StoredFile>;
    totalSize: number;
    lastUpdated: string;
}

class LocalStorageProvider {
    private files: Map<string, StoredFile> = new Map();
    private dbName = 'cryptovault-dev-storage';
    private initialized = false;

    private initialize(): void {
        if (this.initialized) return;
        this.initialized = true;

        if (typeof window !== 'undefined') {
            this.loadFromLocalStorage();
        }
    }

    async upload(
        key: string,
        data: Buffer | Uint8Array | string,
        metadata?: Record<string, string>
    ): Promise<{ key: string; url: string }> {
        this.initialize();

        let base64Data: string;

        if (typeof data === 'string') {
            base64Data = data;
        } else if (data instanceof Uint8Array) {
            let binary = '';
            for (let i = 0; i < data.length; i++) {
                binary += String.fromCharCode(data[i]);
            }
            base64Data = btoa(binary);
        } else {
            // Buffer (Node.js)
            base64Data = (data as Buffer).toString('base64');
        }

        const storedFile: StoredFile = {
            key,
            data: base64Data,
            metadata: metadata || {},
            uploadedAt: new Date().toISOString(),
            size: base64Data.length,
        };

        this.files.set(key, storedFile);
        this.persistToLocalStorage();

        console.log(
            `📦 [LOCAL STORAGE] Uploaded: ${key} (${this.formatSize(base64Data.length)})`
        );

        return {
            key,
            url: `local://${key}`,
        };
    }

    async download(key: string): Promise<Uint8Array> {
        this.initialize();

        const file = this.files.get(key);

        if (!file) {
            throw new Error(`File not found in local storage: ${key}`);
        }

        console.log(`📦 [LOCAL STORAGE] Downloaded: ${key}`);

        const binary = atob(file.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        return bytes;
    }

    async delete(key: string): Promise<void> {
        this.initialize();

        this.files.delete(key);
        this.persistToLocalStorage();

        console.log(`📦 [LOCAL STORAGE] Deleted: ${key}`);
    }

    async list(prefix?: string): Promise<string[]> {
        this.initialize();

        const keys = Array.from(this.files.keys());
        return prefix ? keys.filter((k) => k.startsWith(prefix)) : keys;
    }

    async exists(key: string): Promise<boolean> {
        this.initialize();
        return this.files.has(key);
    }

    async getMetadata(
        key: string
    ): Promise<{ size: number; uploadedAt: string; metadata: Record<string, string> } | null> {
        this.initialize();

        const file = this.files.get(key);
        if (!file) return null;

        return {
            size: file.size,
            uploadedAt: file.uploadedAt,
            metadata: file.metadata,
        };
    }

    getTotalSize(): number {
        let total = 0;
        this.files.forEach((file) => {
            total += file.size;
        });
        return total;
    }

    getFileCount(): number {
        return this.files.size;
    }

    async clear(): Promise<void> {
        this.files.clear();
        this.persistToLocalStorage();
        console.log('📦 [LOCAL STORAGE] Cleared all files');
    }

    private loadFromLocalStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            const storedData = localStorage.getItem(this.dbName);
            if (storedData) {
                const index: StorageIndex = JSON.parse(storedData);
                Object.entries(index.files).forEach(([key, file]) => {
                    this.files.set(key, file);
                });
                console.log(
                    `📦 [LOCAL STORAGE] Loaded ${this.files.size} files from localStorage`
                );
            }
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
        }
    }

    private persistToLocalStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            const index: StorageIndex = {
                files: Object.fromEntries(this.files),
                totalSize: this.getTotalSize(),
                lastUpdated: new Date().toISOString(),
            };
            localStorage.setItem(this.dbName, JSON.stringify(index));
        } catch (e) {
            console.warn('Failed to persist to localStorage (may be full):', e);
        }
    }

    private formatSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export const localStorageProvider = new LocalStorageProvider();
