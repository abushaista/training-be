import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { HashUtil } from '@app/common/utils/hash.util';
import { Role } from '@app/common/constants/role.constant';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService
    ) {
    }

    async validateUser(email: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                email
            }
        });

        if (!user || !user.password) {
            return null;
        }
        const isPasswordValid = await HashUtil.comparePassword(password, user.password);
        if (!isPasswordValid) {
            return null;
        }
        return user;
    }

    private generateToken(user: any) {
        const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
        return this.jwt.sign(payload);
    }

    async login(user: any) {
        const token = this.generateToken(user);
        return {
            access_token: token,
        };
    }

    async validateUserById(userId: string) {
        return this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });
    }

    async googleLogin(profile: any) {
        const email = profile.emails?.[0]?.value ?? profile.email;
        if (!email) {
            throw new Error('Google profile email is required');
        }

        let user = await this.prisma.user.findUnique({
            where: {
                email,
            }
        });

        if (!user) {
            const name = profile.displayName ||
                [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ');

            user = await this.prisma.user.create({
                data: {
                    email,
                    name: name || null,
                    role: Role.TRAINEE,
                    provider: 'google',
                    providerId: profile.id,
                }
            });
        }

        return user;
    }
}
