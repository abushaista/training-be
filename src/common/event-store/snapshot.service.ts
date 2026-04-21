import { BaseSnapshot } from "../events/base.snapshot";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@app/generated/prisma/client";
import { Injectable } from "@nestjs/common";
import { PrismaTransactionClient } from "../prisma/prisma.types";

@Injectable()
export class SnapshotService {
    constructor(private prismaService: PrismaService) { }
    async saveSnapshot<T extends Prisma.InputJsonValue>(aggregateId: string, version: number, state: T, tx?: PrismaTransactionClient): Promise<void> {
        const db = tx ?? this.prismaService;
        await db.snapshot.upsert({
            where: { id: aggregateId },
            update: {
                version,
                state: state,
            },
            create: {
                id: aggregateId,
                aggregateId: aggregateId,
                version,
                state: state,
            },
        });
    }

    async getSnapshot<T extends Prisma.InputJsonValue>(aggregateId: string): Promise<BaseSnapshot<T> | null> {
        const data = await this.prismaService.snapshot.findUnique({
            where: { id: aggregateId },
        });
        if (!data) return null;
        return {
            id: data.id,
            version: data.version,
            state: data.state as T,
        };
    }
}
