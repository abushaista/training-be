import { BaseEvent } from "@app/common/events/base.event";

export class CourseUpdatedEvent extends BaseEvent<{
    title: string;
    content: string;
    description?: string | null;
}> { }