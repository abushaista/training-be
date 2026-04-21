import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { HashUtil } from './common/utils/hash.util';
import { LoggingModule } from './common/logging/logging.module';
import { CourseModule } from './modules/course/course.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    LoggingModule,
    AuthModule,
    CourseModule],
  controllers: [AppController],
  providers: [AppService, HashUtil],
})
export class AppModule { }
