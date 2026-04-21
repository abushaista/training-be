export type EventEnvelope<T = unknown> = {
    eventId: string;
    correlationId?: string;
    aggregateId: string;
    version: number;
    eventType: string;
    occurredAt: string | Date;
    payload: T;
};

export abstract class EventConsumer {
    abstract handle(event: EventEnvelope): Promise<void>;
}

export const RABBITMQ_EVENT_PATTERN = "domain.events";
