import { Injectable } from "@nestjs/common";
import { CourseTransactionService } from "../services/course-transaction.service";
import { EventService } from "../services/event-service";

@Injectable()
export class CreateCourseUseCase {
    constructor(
        private eventService: EventService,
        private courseTransactionService: CourseTransactionService,
    ) { }

    async execute(title: string, content?: string, description?: string, authorId?: string) {
        const course = this.eventService.createAggregate();
        course.create({ title, content, description, authorId });

        const events = course.pullEvents();
        await this.courseTransactionService.run({
            aggregateId: course.getState().id,
            aggregateVersion: course.getState().version,
            events,
            snapshot: course.toSnapshot(),
        });
    }
}
