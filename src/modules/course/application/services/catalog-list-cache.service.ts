import { Injectable } from "@nestjs/common";

type CatalogListCacheValue = {
    catalogs: unknown[];
    total: number;
    page: number;
    limit: number;
};

@Injectable()
export class CatalogListCacheService {
    private readonly ttlMs = 60_000;
    private readonly store = new Map<string, { expiresAt: number; value: CatalogListCacheValue }>();

    buildKey(page: number, limit: number, query?: string) {
        return JSON.stringify({
            page,
            limit,
            query: query ?? "",
        });
    }

    get(key: string) {
        const entry = this.store.get(key);

        if (!entry) {
            return null;
        }

        if (entry.expiresAt <= Date.now()) {
            this.store.delete(key);
            return null;
        }

        return entry.value;
    }

    set(key: string, value: CatalogListCacheValue) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + this.ttlMs,
        });
    }

    clear() {
        this.store.clear();
    }
}