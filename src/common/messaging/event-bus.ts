import { BaseEvent } from "@app/common/events/base.event";

export abstract class EventBus {
    abstract publish(event: BaseEvent): Promise<void>;
    abstract publishMany(events: BaseEvent[]): Promise<void>;
}
