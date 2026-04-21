import { BaseEvent } from "@app/common/events/base.event";

export class CourseCreatedEvent extends BaseEvent<{
    title: string;
    content: string;
    description?: string | null;
    authorId?: string;
}> {
}