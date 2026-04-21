import { Injectable } from "@nestjs/common";
import { CourseTransactionService } from "../services/course-transaction.service";
import { EventService } from "../services/event-service";

@Injectable()
export class UpdateCourseUseCase {
    constructor(
        private readonly eventService: EventService,
        private readonly courseTransactionService: CourseTransactionService,
    ) {
    }

    async execute(id: string, title: string, content?: string, description?: string, authorId?: string) {
        const course = await this.eventService.getAggregate(id);
        if (course == null) {
            throw new Error('Course not found');
        }
        if (course.getState().authorId != authorId) {
            throw new Error('Unauthorized');
        }
        course.update(
            {
                title: title,
                content: content,
                description: description
            }
        );

        const events = course.pullEvents();
        await this.courseTransactionService.run({
            aggregateId: id,
            aggregateVersion: course.getState().version,
            events,
            snapshot: course.toSnapshot(),
        });
    }
}
