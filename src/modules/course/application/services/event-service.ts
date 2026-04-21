import { Injectable } from "@nestjs/common";
import { EventRepository } from "@app/modules/course/domain/repositories/event.repository";
import { EventBus } from "@app/common/messaging/event-bus";
import { CourseAggregate } from "../../domain/aggregates/course.aggregate";
import { BaseEvent } from "@app/common/events/base.event";
import { PrismaTransactionClient } from "@app/common/prisma/prisma.types";
import { BaseSnapshot } from "@app/common/events/base.snapshot";

@Injectable()
export class EventService {
    constructor(
        private eventRepo: EventRepository,
        private eventBus: EventBus,
    ) { }

    createAggregate(): CourseAggregate {
        const id = this.generateId();
        return new CourseAggregate(id);
    }

    async getAggregate(aggregateId: string): Promise<CourseAggregate | null> {
        let version = 0;
        var aggregate = new CourseAggregate(aggregateId);
        var snapshot = await this.eventRepo.getLatestSnapshot(aggregateId);
        if (snapshot) {
            aggregate.applyFromSnapshot(snapshot.state);
            version = snapshot.version;
        }
        const events = await this.eventRepo.getEvents(aggregateId, version);

        if (events.length === 0 && !snapshot) {
            return null;
        }
        aggregate.applyFromHistory(events);
        return aggregate;

    }

    private generateId(): string {
        return crypto.randomUUID();
    }

    async saveEvent(event: any, tx?: PrismaTransactionClient) {
        await this.saveEventOnly(event, tx);
        const aggregate = await this.getAggregate(event.aggregateId);
        await this.eventRepo.saveSnapshot(event.aggregateId, event.version, aggregate?.toSnapshot(), tx);
    }

    async saveEventOnly(event: any, tx?: PrismaTransactionClient) {
        await this.eventRepo.saveEvent(event, tx);
    }

    async saveSnapshot(aggregateId: string, version: number, snapshot: BaseSnapshot | null, tx?: PrismaTransactionClient) {
        await this.eventRepo.saveSnapshot(aggregateId, version, snapshot, tx);
    }

    async publishEvents(events: BaseEvent[]) {
        await this.eventBus.publishMany(events);
    }
}