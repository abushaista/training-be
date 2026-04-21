import { CourseRepository } from "@app/modules/course/domain/repositories/course.repository";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GetCourseUseCase {
    constructor(
        private courseRepository: CourseRepository,
    ) { }

    async execute(id: string) {
        const course = await this.courseRepository.findById(id);
        if (!course) {
            throw new Error('Course not found');
        }
        return course.getState();
    }
}