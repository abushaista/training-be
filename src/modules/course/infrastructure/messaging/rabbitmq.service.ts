import { BaseEvent } from "@app/common/events/base.event";
import { EventBus } from "@app/common/messaging/event-bus";
import { ConfigService } from "@nestjs/config";
import { ClientProxy, ClientProxyFactory, Transport } from "@nestjs/microservices";
import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { RABBITMQ_EVENT_PATTERN } from "@app/common/messaging/event-consumer";

@Injectable()
export class RabbitmqService extends EventBus implements OnModuleDestroy {
    private readonly logger = new Logger(RabbitmqService.name);
    private readonly url?: string;
    private readonly queue: string;
    private client: ClientProxy | null = null;
    constructor(private readonly configService: ConfigService) {
        super();
        this.url = this.configService.get<string>("RABBITMQ_URL");
        this.queue = this.configService.get<string>("RABBITMQ_QUEUE") ?? "training-app.course.events";
    }

    async publish(event: BaseEvent): Promise<void> {
        throw new Error("Method not implemented.");
    }
    async publishMany(events: BaseEvent[]): Promise<void> {
        if (events.length === 0) {
            return;
        }

        const client = this.getClient();
        if (!client) {
            return;
        }

        for (const event of events) {
            const payload = {
                eventId: event.eventId,
                correlationId: event.correlationId,
                aggregateId: event.aggregateId,
                version: event.version,
                eventType: event.eventType,
                occurredAt: event.occurredAt,
                payload: event.payload,
            };

            await client.emit(RABBITMQ_EVENT_PATTERN, payload);
        }
    }

    async onModuleDestroy() {
        if (this.client) {
            await this.client.close();
            this.client = null;
        }
    }

    private getClient(): ClientProxy | null {
        if (!this.url) {
            this.logger.warn("RABBITMQ_URL is not configured. Event bus publishing is disabled.");
            return null;
        }

        if (!this.client) {
            this.client = ClientProxyFactory.create({
                transport: Transport.RMQ,
                options: {
                    urls: [this.url],
                    queue: this.queue,
                    queueOptions: {
                        durable: true,
                    },
                },
            });
        }

        return this.client;
    }

}