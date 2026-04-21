import { ElasticLoggingService } from "@app/common/logging/elastic-logging.service";
import { EventEnvelope } from "@app/common/messaging/event-consumer";
import { PrismaService } from "@app/common/prisma/prisma.service";
import { Saga } from "@app/common/saga/saga.interface";
import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";


type CoursePublishedPayload = {
    title?: string;
    content?: string;
    description?: string | null;
    authorId?: string;
};

type RollbackCourseState = {
    id: string;
    title: string;
    content: string;
    description: string | null;
    authorId: string;
    status: string | null;
    version: number;
};

type RollbackCatalogState = {
    id: string;
    title: string;
    content: string;
    description: string | null;
    publishedAt: Date;
    courseId: string;
    version: number;
    status: string | null;
};

type CoursePublishedRollbackContext = {
    course: RollbackCourseState | null;
    catalogs: RollbackCatalogState[];
};

@Injectable()
export class CoursePublishedSaga implements Saga {
    private readonly rollbackContexts = new Map<string, CoursePublishedRollbackContext>();

    constructor(
        private readonly prismaService: PrismaService,
        private readonly moduleRef: ModuleRef,
        private readonly elasticLoggingService: ElasticLoggingService,
    ) { }

    supports(event: EventEnvelope): boolean {
        return event.eventType === "CoursePublishedEvent";
    }

    async execute(event: EventEnvelope): Promise<void> {
        const occurredAt = new Date(event.occurredAt);
        const payload = event.payload as CoursePublishedPayload;
        this.rollbackContexts.set(event.eventId, await this.captureRollbackContext(event.aggregateId));

        try {
            await this.prismaService.withTransaction(async (tx) => {
                await tx.course.upsert({
                    where: { id: event.aggregateId },
                    update: {
                        title: payload.title,
                        content: payload.content,
                        description: payload.description ?? null,
                        authorId: payload.authorId,
                        status: "PUBLISHED",
                        version: event.version,
                    },
                    create: {
                        id: event.aggregateId,
                        title: payload.title ?? "",
                        content: payload.content ?? "",
                        description: payload.description ?? null,
                        authorId: payload.authorId ?? "",
                        status: "PUBLISHED",
                        version: event.version,
                    },
                });

                await tx.catalog.updateMany({
                    where: {
                        courseId: event.aggregateId,
                        status: "ACTIVE",
                        NOT: {
                            version: event.version,
                        },
                    },
                    data: {
                        status: "DEPRECATED",
                    },
                });

                await tx.catalog.upsert({
                    where: {
                        courseId_version: {
                            courseId: event.aggregateId,
                            version: event.version,
                        },
                    },
                    update: {
                        title: payload.title ?? "",
                        content: payload.content ?? "",
                        description: payload.description ?? null,
                        publishedAt: occurredAt,
                        status: "ACTIVE",
                    },
                    create: {
                        id: crypto.randomUUID(),
                        title: payload.title ?? "",
                        content: payload.content ?? "",
                        description: payload.description ?? null,
                        publishedAt: occurredAt,
                        courseId: event.aggregateId,
                        version: event.version,
                        status: "ACTIVE",
                    },
                });
            });
        } catch (error) {
            await this.elasticLoggingService.error(
                `Course published saga failed for aggregate ${event.aggregateId}`,
                CoursePublishedSaga.name,
                {
                    eventId: event.eventId,
                    correlationId: event.correlationId,
                    aggregateId: event.aggregateId,
                    version: event.version,
                    eventType: event.eventType,
                    reason: error instanceof Error ? error.message : String(error),
                },
            );
            throw error;
        }
    }

    async rollback(event: EventEnvelope): Promise<void> {
        const context = this.rollbackContexts.get(event.eventId);

        if (!context) {
            return;
        }

        await this.prismaService.withTransaction(async (tx) => {
            if (context.course) {
                await tx.course.upsert({
                    where: { id: context.course.id },
                    update: {
                        title: context.course.title,
                        content: context.course.content,
                        description: context.course.description,
                        authorId: context.course.authorId,
                        status: context.course.status,
                        version: context.course.version,
                    },
                    create: context.course,
                });
            } else {
                await tx.course.deleteMany({
                    where: { id: event.aggregateId },
                });
            }

            const previousVersions = context.catalogs.map((catalog) => catalog.version);

            await tx.catalog.deleteMany({
                where: {
                    courseId: event.aggregateId,
                    version: {
                        notIn: previousVersions,
                    },
                },
            });

            for (const catalog of context.catalogs) {
                await tx.catalog.upsert({
                    where: {
                        courseId_version: {
                            courseId: catalog.courseId,
                            version: catalog.version,
                        },
                    },
                    update: {
                        title: catalog.title,
                        content: catalog.content,
                        description: catalog.description,
                        publishedAt: catalog.publishedAt,
                        status: catalog.status,
                    },
                    create: catalog,
                });
            }
        });

        this.rollbackContexts.delete(event.eventId);

        await this.elasticLoggingService.info(
            `Course published saga rolled back for aggregate ${event.aggregateId}`,
            CoursePublishedSaga.name,
            {
                eventId: event.eventId,
                correlationId: event.correlationId,
                aggregateId: event.aggregateId,
                version: event.version,
                eventType: event.eventType,
            },
        );
    }

    private async captureRollbackContext(aggregateId: string): Promise<CoursePublishedRollbackContext> {
        const [course, catalogs] = await Promise.all([
            this.prismaService.course.findUnique({
                where: { id: aggregateId },
            }),
            this.prismaService.catalog.findMany({
                where: { courseId: aggregateId },
            }),
        ]);

        return {
            course: course ? {
                id: course.id,
                title: course.title,
                content: course.content,
                description: course.description,
                authorId: course.authorId,
                status: course.status,
                version: course.version,
            } : null,
            catalogs: catalogs.map((catalog) => ({
                id: catalog.id,
                title: catalog.title,
                content: catalog.content,
                description: catalog.description,
                publishedAt: catalog.publishedAt,
                courseId: catalog.courseId,
                version: catalog.version,
                status: catalog.status,
            })),
        };
    }
}