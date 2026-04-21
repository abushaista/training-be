import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CourseDto {
    @ApiProperty({
        example: "Introduction to NestJS",
        description: "The title of the course",
    })
    @Transform(({ value }) => typeof value === "string" ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    title!: string;

    @ApiProperty({
        example: "This is a simple introduction to NestJS",
        description: "The content of the course",
    })
    @Transform(({ value }) => typeof value === "string" ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    content?: string;

    @ApiProperty({
        example: "A brief description of the course",
        description: "The description of the course",
    })
    @Transform(({ value }) => typeof value === "string" ? value.trim() : value)
    @IsOptional()
    @IsString()
    description?: string;
}
