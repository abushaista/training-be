import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
} from "@nestjs/common";
import { Response } from "express";
import { ElasticLoggingService } from "@app/common/logging/elastic-logging.service";
import { RequestWithCorrelationId } from "@app/common/middleware/correlation-id.middleware";

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    constructor(private readonly elasticLoggingService: ElasticLoggingService) { }

    async catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<RequestWithCorrelationId>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse =
            exception instanceof HttpException
                ? exception.getResponse()
                : "Internal server error";

        const message =
            typeof exceptionResponse === "string"
                ? exceptionResponse
                : (exceptionResponse as Record<string, unknown>).message ?? "Internal server error";

        const stack = exception instanceof Error ? exception.stack : undefined;

        this.logger.error(
            `${request?.method ?? "UNKNOWN"} ${request?.url ?? "N/A"} - ${String(message)}`,
            stack,
        );

        await this.elasticLoggingService.error(
            typeof message === "string" ? message : "Unhandled exception",
            AllExceptionsFilter.name,
            {
                statusCode: status,
                method: request?.method,
                path: request?.url,
                query: request?.query,
                params: request?.params,
                userAgent: request?.headers["user-agent"],
                ip: request?.ip,
                correlationId: request?.correlationId,
                stack,
            },
        );

        if (!response || response.headersSent) {
            return;
        }

        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request?.url,
            correlationId: request?.correlationId,
        });
    }
}
