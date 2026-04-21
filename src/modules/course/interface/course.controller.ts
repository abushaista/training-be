import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { UpdateCourseUseCase } from "../application/use-cases/update-course.usecase";
import { GetAllCourseUseCase } from "../application/use-cases/get-all-course.usecase";
import { GetCourseUseCase } from "../application/use-cases/get-course.usecase";
import { CreateCourseUseCase } from "../application/use-cases/create-course.usecase";
import { PublishCourseUseCase } from "../application/use-cases/publish-course.usecase";
import { JwtAuthGuard } from "@app/common/guards/jwt-auth.guard";
import { Roles } from "@app/common/decorators/roles.decorator";
import { RoleGuard } from "@app/common/guards/role.guard";
import { CourseDto } from "./dto/course.dto";

@Controller('courses')
export class CourseController {
    constructor(private publishUseCase: PublishCourseUseCase,
        private createUseCase: CreateCourseUseCase,
        private getcourseUseCase: GetCourseUseCase,
        private getAllCourseUseCase: GetAllCourseUseCase,
        private updateCourseUseCase: UpdateCourseUseCase,
    ) { }

    @Post(':id/publish')
    @UseGuards(JwtAuthGuard)
    @Roles('TRAINER')
    publish(@Param('id') id: string, @Req() req) {
        const userId = req.user.id;
        return this.publishUseCase.execute(id, userId);
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('TRAINER')
    @Post()
    create(@Req() req, @Body() body: CourseDto) {
        const authorId = req.user.id;
        return this.createUseCase.execute(body.title, body.content, body.description, authorId);
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('TRAINER')
    @Patch(':id')
    update(@Param('id') id: string, @Body() body: CourseDto, @Req() req) {
        const userId = req.user.id;
        return this.updateCourseUseCase.execute(id, body.title, body.content, body.description, userId);
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('TRAINER')
    @Get(':id')
    get(@Param('id') id: string) {
        return this.getcourseUseCase.execute(id);
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('TRAINER')
    @Get()
    getAll(@Req() req) {
        const { page, limit, query } = req.query;
        const pageNum = page ? Number(page) : 1;
        const limitNum = limit ? Number(limit) : 10;
        return this.getAllCourseUseCase.execute(pageNum, limitNum, query as string);
    }
}