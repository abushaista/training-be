import { EventConsumer, type EventEnvelope, RABBITMQ_EVENT_PATTERN } from "@app/common/messaging/event-consumer";
import { PrismaService } from "@app/common/prisma/prisma.service";
import { PrismaTransactionClient } from "@app/common/prisma/prisma.types";
import { Injectable, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";
import { Prisma } from "@generated/prisma/client";
import { SagaManager } from "@app/common/saga/saga-manager";


type ConsumedEventPersistence = {
    course: {
        findUnique(args: {
            where: { id: string };
            select: { authorId: true };
        }): Promise<{ authorId: string } | null>;
        upsert(args: {
            where: { id: string };
            update: Record<string, unknown>;
            create: Record<string, unknown>;
        }): Promise<unknown>;
    };
    catalog: {
        findFirst(args: {
            where: { courseId: string };
            orderBy: { version: "desc" };
        }): Promise<{ version: number } | null>;
        updateMany(args: {
            where: { courseId: string; status: string };
            data: { status: string };
        }): Promise<unknown>;
        upsert(args: {
            where: { courseId_version: { courseId: string; version: number } };
            update: Record<string, unknown>;
            create: Record<string, unknown>;
        }): Promise<unknown>;
    };
    consumedEvent: {
        findUnique(args: {
            where: { eventId: string };
        }): Promise<unknown | null>;
        create(args: {
            data: {
                eventId: string;
                aggregateId: string;
                version: number;
                eventType: string;
                payload: Prisma.InputJsonValue;
                occurredAt: Date;
            };
        }): Promise<unknown>;
    };
};

@Injectable()
export class RabbitmqConsumerService extends EventConsumer {
    private readonly logger = new Logger(RabbitmqConsumerService.name);
    private readonly allowedCorrelationIds: Set<string>;
    constructor(
        private readonly prismaService: PrismaService,
        private readonly sagaManager: SagaManager,
    ) {
        super();
        const configured = process.env.RABBITMQ_ALLOWED_CORRELATION_IDS ?? "";
        this.allowedCorrelationIds = new Set(
            configured
                .split(",")
                .map((value) => value.trim())
                .filter((value) => value.length > 0),
        );
    }

    @EventPattern(RABBITMQ_EVENT_PATTERN)
    async handle(@Payload() event: EventEnvelope, @Ctx() context?: RmqContext): Promise<void> {
        if (!this.matchesCorrelationId(event.correlationId)) {
            this.logger.warn(
                `Skipping event ${event.eventType} because correlationId '${event.correlationId ?? "undefined"}' is not allowed.`,
            );
            this.ack(context);
            return;
        }

        try {
            const occurredAt = new Date(event.occurredAt);

            await this.prismaService.withTransaction(async (tx) => {

                const prisma = tx as PrismaTransactionClient & ConsumedEventPersistence;

                const existing = await prisma.consumedEvent.findUnique({
                    where: { eventId: event.eventId },
                });

                if (existing) {
                    return;
                }

                await this.persistReadModel(prisma, event, occurredAt);

                await prisma.consumedEvent.create({
                    data: {
                        eventId: event.eventId,
                        aggregateId: event.aggregateId,
                        version: event.version,
                        eventType: event.eventType,
                        payload: event.payload as Prisma.InputJsonValue,
                        occurredAt,
                    },
                });
            });

            await this.sagaManager.execute(event);
            this.logger.log(
                `Consumed event ${event.eventType} for aggregate ${event.aggregateId} at version ${event.version}`,
            );
            this.ack(context);


        } catch (error) {
            this.logger.error(`Failed to process event ${event.eventType}: ${error instanceof Error ? error.message : String(error)}`);
            this.nack(context);
        }

    }

    private matchesCorrelationId(correlationId?: string) {
        if (this.allowedCorrelationIds.size === 0) {
            return true;
        }

        if (!correlationId) {
            return false;
        }

        return this.allowedCorrelationIds.has(correlationId);
    }


    private async persistReadModel(
        prisma: PrismaTransactionClient & ConsumedEventPersistence,
        event: EventEnvelope,
        occurredAt: Date,
    ) {
        const payload = event.payload as Record<string, unknown>;
        switch (event.eventType) {
            case "CourseCreatedEvent":
                await prisma.course.upsert({
                    where: { id: event.aggregateId },
                    update: {
                        title: payload["title"] as string,
                        content: payload["content"] as string,
                        description: payload["description"] as string ?? null,
                        authorId: payload["authorId"] as string,
                        status: "DRAFT",
                        version: event.version,
                        updatedAt: occurredAt,
                    },
                    create: {
                        id: event.aggregateId,
                        title: payload["title"] as string,
                        content: payload["content"] as string,
                        description: payload["description"] as string ?? null,
                        authorId: payload["authorId"] as string,
                        status: "DRAFT",
                        version: event.version,
                    },
                });
                break;
            case "CoursePublishedEvent":
                await prisma.course.update({
                    where: { id: event.aggregateId },
                    data: {
                        status: "PUBLISHED",
                        version: event.version,
                        updatedAt: occurredAt,
                    },
                });
                break;
            case "CourseUpdatedEvent":
                await prisma.course.update({
                    where: { id: event.aggregateId },
                    data: {
                        title: payload["title"] as string,
                        content: payload["content"] as string,
                        description: payload["description"] as string ?? null,
                        authorId: payload["authorId"] as string,
                        status: "DRAFT",
                        version: event.version,
                        updatedAt: occurredAt,
                    },
                });
                break;
            default:
                this.logger.warn(`No handler for event type ${event.eventType}`);
                break;
        }
    }


    private ack(context?: RmqContext) {
        if (!context) {
            return;
        }

        const channel = context.getChannelRef();
        const message = context.getMessage();
        channel.ack(message);
    }

    private nack(context?: RmqContext) {
        if (!context) {
            return;
        }

        const channel = context.getChannelRef();
        const message = context.getMessage();
        channel.nack(message, false, false);
    }

}