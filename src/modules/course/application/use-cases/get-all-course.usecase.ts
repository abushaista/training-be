import { CourseRepository } from "@app/modules/course/domain/repositories/course.repository";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GetAllCourseUseCase {
    constructor(
        private courseRepository: CourseRepository,
    ) { }

    async execute(page: number = 1, limit: number = 10, query?: string) {
        return await this.courseRepository.getPaginated(page, limit, query);
    }
}   