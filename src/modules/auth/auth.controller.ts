import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthGuard } from '@app/common/guards/google-auth.guard';
import { TrainerDto } from './dto/trainer.dto';
import { Roles } from '@app/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard';
import { RoleGuard } from '@app/common/guards/role.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService,) { }

    @Post('login')
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiBody({ type: LoginDto })
    @ApiOkResponse({
        description: 'JWT access token returned successfully',
        schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
        },
    })
    @ApiUnauthorizedResponse({
        description: 'Invalid login credentials',
        schema: {
            example: {
                message: 'Invalid credentials',
            },
        },
    })
    async login(@Body() dto: LoginDto) {
        const user = await this.authService.validateUser(dto.email, dto.password);
        if (!user) {
            return { message: 'Invalid credentials' };
        }
        return this.authService.login(user);
    }

    @Get('google')
    @ApiOperation({ summary: 'Start Google OAuth login flow' })
    @ApiOkResponse({
        description: 'Redirects the user to Google authentication',
    })
    @UseGuards(GoogleAuthGuard)
    async googleLogin() { }

    @Get('google/callback')
    @ApiOperation({ summary: 'Google OAuth callback endpoint' })
    @ApiOkResponse({
        description: 'JWT access token returned after successful Google authentication',
        schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
        },
    })
    @UseGuards(GoogleAuthGuard)
    async googleLoginCallback(@Req() req) {
        return this.authService.login(req.user);
    }

    @Post('seed-trainer')
    @ApiOperation({ summary: 'Seed a default trainer user' })
    @ApiOkResponse({
        description: 'Default trainer user seeded successfully',
    })
    async seedTrainer() {
        await this.authService.seedTrainer();
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('TRAINER')
    @Post('add-trainer')
    @ApiOperation({ summary: 'Add a new trainer user' })
    @ApiOkResponse({
        description: 'Trainer user added successfully',
    })
    async addTrainer(@Body() body: TrainerDto) {
        await this.authService.addTrainer(body.email, body.name, body.password);
    }

}
