import { CourseAggregate } from "@app/modules/course/domain/aggregates/course.aggregate";
import { CourseRepository } from "@app/modules/course/domain/repositories/course.repository";
import { PrismaService } from "@app/common/prisma/prisma.service";
import { PrismaTransactionClient } from "@app/common/prisma/prisma.types";
import { Injectable } from "@nestjs/common/decorators/core/injectable.decorator";
import { CourseState } from "@app/modules/course/domain/aggregates/course.state";

@Injectable()
export class PrismaCourseRepository implements CourseRepository {
    constructor(private prisma: PrismaService) { }
    async findById(id: string): Promise<CourseAggregate | null> {
        const data = await this.prisma.course.findUnique({
            where: { id },
        });
        if (!data) return null;
        return new CourseAggregate(
            data.id
        );
    }
    async save(course: CourseAggregate, tx?: PrismaTransactionClient): Promise<void> {
        const state = course.getState();
        const db = tx ?? this.prisma;
        await db.course.update({
            where: { id: state.id },
            data: {
                title: state.title,
                content: state.content,
                description: state.description,
                authorId: state.authorId,
                status: state.status,
                version: state.version,
            },
        });
    }

    async create(course: CourseAggregate, tx?: PrismaTransactionClient): Promise<void> {
        const state = course.getState();
        const db = tx ?? this.prisma;
        await db.course.create({
            data: {
                id: state.id,
                title: state.title!,
                content: state.content!,
                description: state.description!,
                authorId: state.authorId!,
                status: state.status,
                version: state.version,
            },
        });
    }
    async getPaginated(page: number, limit: number, query?: string): Promise<
        {
            courses: CourseState[];
            total: number;
            page: number;
            limit: number;
        }
    > {

        const data = await this.prisma.course.findMany({
            where: query ? {
                OR: [
                    { title: { contains: query } },
                    { description: { contains: query } },
                ]
            } : {},
            skip: (page - 1) * limit,
            take: limit,
        });


        const total = await this.prisma.course.count({
            where: query ? {
                OR: [
                    { title: { contains: query } },
                    { description: { contains: query } },
                ]
            } : {},
        });

        return {
            courses: data.map((c) => this.toState(c)),
            total,
            page,
            limit
        };
    }

    private toState(data: any): CourseState {
        const status = data.status as 'DRAFT' | 'PUBLISHED';
        return new CourseState(
            data.id,
            data.title,
            data.content,
            data.description,
            data.authorId,
            status,
            data.version,
        );
    }
}
