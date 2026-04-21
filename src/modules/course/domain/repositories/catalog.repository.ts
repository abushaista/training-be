import { Catalog } from '../entities/catalog.entity';
import { PrismaTransactionClient } from '@app/common/prisma/prisma.types';

export abstract class CatalogRepository {
    abstract upsert(catalog: Catalog, tx?: PrismaTransactionClient): Promise<void>;
    abstract getLatestVersion(courseId: string, tx?: PrismaTransactionClient): Promise<number | null>;
    abstract create(catalog: Catalog, tx?: PrismaTransactionClient): Promise<void>;
    abstract getPaginated(page: number, limit: number, query?: string): Promise<{
        catalogs: Catalog[];
        total: number;
        page: number;
        limit: number;
    }>;
    abstract getCurrentCatalog(courseId: string): Promise<Catalog | null>;
}
