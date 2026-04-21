
import { PrismaTransactionClient } from "@app/common/prisma/prisma.types";

export abstract class EventRepository {
    abstract saveEvent(event: any, tx?: PrismaTransactionClient): Promise<void>;
    abstract getEvents(aggregateId: string, fromVersion?: number): Promise<any[]>;
    abstract saveSnapshot(aggregateId: string, version: number, snapshot: any, tx?: PrismaTransactionClient): Promise<void>;
    abstract getLatestSnapshot(aggregateId: string): Promise<any | null>;
}
