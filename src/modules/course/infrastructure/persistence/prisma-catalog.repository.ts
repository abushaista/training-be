import { Catalog } from "@app/modules/course/domain/entities/catalog.entity";
import { CatalogRepository } from "@app/modules/course/domain/repositories/catalog.repository";
import { PrismaService } from "@app/common/prisma/prisma.service";
import { PrismaTransactionClient } from "@app/common/prisma/prisma.types";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PrismaCatalogRepository implements CatalogRepository {
    constructor(private prisma: PrismaService) { }

    async upsert(catalog: Catalog, tx?: PrismaTransactionClient): Promise<void> {
        const persist = async (db: PrismaTransactionClient | PrismaService) => {
            await db.catalog.updateMany({
                where: {
                    courseId: catalog.courseId!,
                    status: 'ACTIVE',
                },
                data: {
                    status: 'DEPRECATED',
                },
            });

            await db.catalog.upsert({
                where: {
                    courseId_version: {
                        courseId: catalog.courseId!,
                        version: catalog.version,
                    },
                },
                update: {
                    title: catalog.title,
                    content: catalog.content,
                    description: catalog.description,
                    publishedAt: new Date(),
                    status: 'ACTIVE',
                },
                create: {
                    id: catalog.id,
                    title: catalog.title,
                    content: catalog.content,
                    description: catalog.description,
                    publishedAt: catalog.publishedAt ?? new Date(),
                    courseId: catalog.courseId!,
                    version: catalog.version,
                    status: 'ACTIVE',
                },
            });
        };

        if (tx) {
            await persist(tx);
            return;
        }

        await this.prisma.withTransaction(async (transaction) => {
            await persist(transaction);
        });
    }

    async getLatestVersion(courseId: string, tx?: PrismaTransactionClient): Promise<number | null> {
        const db = tx ?? this.prisma;
        const latest = await db.catalog.findFirst({
            where: { courseId },
            orderBy: { version: 'desc' },
        });
        return latest ? latest.version : null;
    }

    async create(catalog: Catalog, tx?: PrismaTransactionClient): Promise<void> {
        const db = tx ?? this.prisma;
        await db.catalog.create({
            data: {
                title: catalog.title,
                content: catalog.content,
                description: catalog.description,
                courseId: catalog.courseId!,
                version: catalog.version,
                status: 'ACTIVE',
            },
        });
    }

    async getPaginated(page: number, limit: number, query?: string): Promise<{
        catalogs: Catalog[];
        total: number;
        page: number;
        limit: number;
    }> {
        const data = await this.prisma.catalog.findMany({
            where: query ? {
                OR: [
                    { title: { contains: query } },
                    { description: { contains: query } },
                ],
                AND: { status: 'ACTIVE' },
            } : {
                status: 'ACTIVE',
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await this.prisma.catalog.count({
            where: query ? {
                OR: [
                    { title: { contains: query } },
                    { description: { contains: query } },
                ],
                AND: { status: 'ACTIVE' },
            } : {
                status: 'ACTIVE',
            },
        });

        return {
            catalogs: data.map((d) => this.mapToCatalog(d)),
            total,
            page,
            limit,
        };

    }

    private mapToCatalog(data: any): Catalog {
        return new Catalog(
            data.id,
            data.title,
            data.content,
            data.description,
            data.publishedAt,
            data.courseId,
            data.version,
        );
    }

    async getCurrentCatalog(courseId: string): Promise<Catalog | null> {
        const data = await this.prisma.catalog.findFirst({
            where: { courseId, status: 'ACTIVE' },
            orderBy: { version: 'desc' },
        });
        return data ? this.mapToCatalog(data) : null;
    }
}
