import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
    @ApiProperty({
        description: "The email of the user",
        example: "Registered user email address",
    })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({
        description: "The password of the user",
        example: "Registered user password",
    })
    @IsNotEmpty()
    @IsString()
    password!: string;
}