import { CatalogRepository } from "@app/modules/course/domain/repositories/catalog.repository";
import { Injectable } from "@nestjs/common";
import { CatalogListCacheService } from "../services/catalog-list-cache.service";

@Injectable()
export class GetAllCatalogUseCase {
    constructor(
        private catalogRepository: CatalogRepository,
        private catalogListCache: CatalogListCacheService,
    ) { }

    async execute(page: number = 1, limit: number = 10, query?: string) {
        const key = this.catalogListCache.buildKey(page, limit, query);
        const cached = this.catalogListCache.get(key);

        if (cached) {
            return cached;
        }

        const result = await this.catalogRepository.getPaginated(page, limit, query);
        this.catalogListCache.set(key, result);
        return result;
    }
}
