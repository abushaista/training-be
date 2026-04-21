import { BaseEvent } from "@app/common/events/base.event";
import { CoursePublishedEvent } from "../events/course-published.event";
import { CourseCreatedEvent } from "../events/course-created.event";
import { CourseUpdatedEvent } from "../events/course-updated.event";
import { CourseState } from "./course.state";
import { BaseSnapshot } from "@app/common/events/base.snapshot";

export class CourseAggregate {
    private id: string;
    private title?: string;
    private content?: string;
    private description?: string | null;
    private status?: 'DRAFT' | 'PUBLISHED';
    private authorId?: string;

    private version = 0;

    private events: BaseEvent[] = [];

    constructor(id: string) {
        this.id = id;
    }


    create(data: any) {
        this.apply(new CourseCreatedEvent({
            aggregateId: this.id,
            version: this.version + 1,
            payload: data,
        }))
    }

    update(data: any) {
        this.apply(new CourseUpdatedEvent(
            {
                aggregateId: this.id,
                version: this.version + 1,
                payload: data
            }
        ));
    }

    publish() {
        const hasTitle = this.title?.trim().length;
        const hasContent = this.content?.trim().length;

        if (!hasTitle || !hasContent || this.status !== 'DRAFT') {
            throw new Error('Course invalid for publishing');
        }

        this.apply(new CoursePublishedEvent({
            aggregateId: this.id,
            version: this.version + 1,
            payload: {
                title: this.title!,
                content: this.content!,
                description: this.description,
                authorId: this.authorId,
            },
        }));

    }

    pullEvents() {
        const events = this.events;
        this.events = [];
        return events;
    }


    private apply(event: BaseEvent) {
        this.version = event.version;
        this.events.push(event);
        this.when(event);
    }

    private when(event: BaseEvent) {
        if (event instanceof CourseCreatedEvent) {
            this.title = event.payload.title;
            this.content = event.payload.content;
            this.description = event.payload.description;
            this.authorId = event.payload.authorId;
            this.status = 'DRAFT';
            this.version = event.version;
        } else if (event instanceof CoursePublishedEvent) {
            this.version = event.version;
            this.status = 'PUBLISHED';
        } else if (event instanceof CourseUpdatedEvent) {
            this.title = event.payload.title;
            this.content = event.payload.content;
            this.description = event.payload.description;
            this.status = 'DRAFT';
            this.version = event.version;
        }
    }

    applyFromHistory(events: BaseEvent[]) {
        events.forEach(event => {
            this.when(event);
        });
    }

    applyFromSnapshot(state: CourseState) {
        this.id = state.id;
        this.title = state.title;
        this.content = state.content;
        this.description = state.description;
        this.status = state.status;
        this.version = state.version;
        this.authorId = state.authorId;
    }

    getState(): CourseState {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            description: this.description,
            authorId: this.authorId,
            status: this.status,
            version: this.version,
        }
    }


    toSnapshot(): BaseSnapshot<CourseState> {
        return {
            id: this.id,
            version: this.version,
            state: new CourseState(
                this.id,
                this.title,
                this.content,
                this.description,
                this.authorId,
                this.status,
                this.version
            )
        };
    }
}