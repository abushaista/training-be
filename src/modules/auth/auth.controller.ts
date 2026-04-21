import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthGuard } from '@app/common/guards/google-auth.guard';

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
}
