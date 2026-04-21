import { BaseEvent } from "../events/base.event";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PrismaTransactionClient } from "../prisma/prisma.types";

@Injectable()
export class EventStoreService {
    constructor(private readonly prismaService: PrismaService) { }
    async saveEvent(event: any, tx?: PrismaTransactionClient): Promise<void> {
        const db = tx ?? this.prismaService;
        await db.eventStore.create({
            data: {
                id: event.id,
                aggregateId: event.aggregateId,
                version: event.version,
                eventType: event.constructor.name,
                payload: event,
                createdAt: new Date(),
            },
        });
    }

    async getEvents(aggregateId: string, fromVersion: number = 0): Promise<any[]> {
        const events = await this.prismaService.eventStore.findMany({
            where: {
                aggregateId,
                version: { gte: fromVersion },
            },
            orderBy: {
                version: 'asc',
            },
        });
        return events;
    }
}
