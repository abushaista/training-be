import { EventStoreService } from "@app/common/event-store/event-store.service";
import { SnapshotService } from "@app/common/event-store/snapshot.service";
import { PrismaTransactionClient } from "@app/common/prisma/prisma.types";
import { EventRepository } from "../../domain/repositories/event.repository";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PrismaEventRepository extends EventRepository {
    constructor(private eventStore: EventStoreService,
        private snapshotService: SnapshotService) {
        super();
    }

    async saveEvent(event: any, tx?: PrismaTransactionClient): Promise<void> {
        await this.eventStore.saveEvent(event, tx);
    }

    async getEvents(aggregateId: string, fromVersion: number = 0): Promise<any[]> {
        return await this.eventStore.getEvents(aggregateId, fromVersion);
    }


    async saveSnapshot(aggregateId: string, version: number, snapshot: any, tx?: PrismaTransactionClient): Promise<void> {
        await this.snapshotService.saveSnapshot(aggregateId, version, snapshot, tx);
    }

    async getLatestSnapshot(aggregateId: string): Promise<any | null> {
        return await this.snapshotService.getSnapshot(aggregateId);
    }

}
