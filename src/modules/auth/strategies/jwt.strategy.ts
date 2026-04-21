import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { AuthService } from "../auth.service";
import { JwtPayload } from "../types/jwt.payload.type";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET || 'your-jwt-secret',
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.authService.validateUserById(payload.sub);
        if (!user) {
            this.logger.warn(`Unauthorized JWT access attempt for subject=${payload.sub}`);
            throw new UnauthorizedException();
        }
        return user;
    }

}