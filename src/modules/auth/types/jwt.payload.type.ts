export type JwtPayload = {
    sub: string;
    email: string;
    name: string;
    role: 'TRAINER' | 'TRAINEE';
};