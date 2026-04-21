import { CourseAggregate } from '../aggregates/course.aggregate';
import { CourseState } from '../aggregates/course.state';
import { PrismaTransactionClient } from '@app/common/prisma/prisma.types';

export abstract class CourseRepository {
    abstract findById(id: string): Promise<CourseAggregate | null>;
    abstract save(course: CourseAggregate, tx?: PrismaTransactionClient): Promise<void>;
    abstract create(course: CourseAggregate, tx?: PrismaTransactionClient): Promise<void>;
    abstract getPaginated(page: number, limit: number, query?: string): Promise<
        {
            courses: CourseState[];
            total: number,
            page: number,
            limit: number,
        }
    >;
}
