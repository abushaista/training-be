import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class TrainerDto {
    @ApiProperty({
        description: "The name of the trainer",
        example: "John Doe",
    })
    @IsString()
    name!: string;
    @ApiProperty({
        description: "The email address of the trainer",
        example: "john.doe@example.com",
    })
    @IsEmail()
    email!: string;
    @ApiProperty({
        description: "The password for the trainer account",
        example: "SecurePassword123",
    })
    @IsString()
    password!: string;
}