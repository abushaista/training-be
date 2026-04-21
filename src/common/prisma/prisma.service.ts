import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@generated/prisma/client";
import { PrismaTransactionClient } from "./prisma.types";

@Injectable()
export class PrismaService extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error("DATABASE_URL is not configured.");
        }

        super({
            adapter: new PrismaPg({ connectionString }),
        });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    async withTransaction<T>(callback: (tx: PrismaTransactionClient) => Promise<T>): Promise<T> {
        return this.$transaction(async (tx) => callback(tx));
    }
}
