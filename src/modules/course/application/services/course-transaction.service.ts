import { Injectable } from "@nestjs/common";
import { EventService } from "./event-service";
import { PrismaService } from "@app/common/prisma/prisma.service";
import { BaseEvent } from "@app/common/events/base.event";
import { BaseSnapshot } from "@app/common/events/base.snapshot";

@Injectable()
export class CourseTransactionService {
    constructor(
        private eventService: EventService,
        private readonly prismaService: PrismaService,
    ) { }

    async run<T>(params: {
        aggregateId: string;
        aggregateVersion: number;
        events: BaseEvent[];
        snapshot: BaseSnapshot;
    }): Promise<void> {
        await this.prismaService.withTransaction(async (tx) => {
            for (const event of params.events) {
                await this.eventService.saveEventOnly(event, tx);
            }

            await this.eventService.saveSnapshot(
                params.aggregateId,
                params.aggregateVersion,
                params.snapshot,
                tx,
            );
        });

        await this.eventService.publishEvents(params.events);
    }
}