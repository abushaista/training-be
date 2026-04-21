import { EventEnvelope } from "@app/common/messaging/event-consumer";

export interface Saga {
    supports(event: EventEnvelope): boolean;
    execute(event: EventEnvelope): Promise<void>;
    rollback?(event: EventEnvelope): Promise<void>;
}
