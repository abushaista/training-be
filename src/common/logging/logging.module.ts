import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ElasticLoggingService } from "./elastic-logging.service";

@Global()
@Module({
    imports: [ConfigModule],
    providers: [ElasticLoggingService],
    exports: [ElasticLoggingService],
})
export class LoggingModule { }
