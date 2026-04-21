import { Injectable } from "@nestjs/common";
import { CourseTransactionService } from "../services/course-transaction.service";
import { EventService } from "../services/event-service";

@Injectable()
export class PublishCourseUseCase {
    constructor(
        private eventService: EventService,
        private courseTransactionService: CourseTransactionService,
    ) { }

    async execute(courseId: string, userId: string) {
        const course = await this.eventService.getAggregate(courseId);

        if (!course) {
            throw new Error("Course not found");
        }

        if (course.getState().authorId !== userId) {
            throw new Error("Unauthorized");
        }

        course.publish();
        const events = course.pullEvents();

        await this.courseTransactionService.run({
            aggregateId: courseId,
            aggregateVersion: course.getState().version,
            events,
            snapshot: course.toSnapshot(),
        });
    }
}
