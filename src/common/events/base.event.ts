export abstract class BaseEvent<T = any> {
    readonly eventId: string;
    readonly correlationId: string;
    readonly aggregateId: string;
    readonly version: number;
    readonly eventType: string;
    readonly payload: T;
    readonly occurredAt: Date;
    constructor(params: {
        correlationId?: string;
        aggregateId: string;
        version: number;
        payload: T;
    }) {
        this.eventId = crypto.randomUUID();
        this.correlationId = params.correlationId ?? params.aggregateId;
        this.aggregateId = params.aggregateId;
        this.version = params.version;
        this.payload = params.payload;
        this.eventType = this.constructor.name;
        this.occurredAt = new Date();
    }

}
