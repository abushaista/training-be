import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type ElasticLogPayload = {
    level: "info" | "error";
    message: string;
    context?: string;
    timestamp?: string;
    metadata?: Record<string, unknown>;
};

@Injectable()
export class ElasticLoggingService {
    private readonly logger = new Logger(ElasticLoggingService.name);
    private readonly baseUrl?: string;
    private readonly index: string;
    private readonly username?: string;
    private readonly password?: string;

    constructor(private readonly configService: ConfigService) {
        this.baseUrl = this.configService.get<string>("ELASTICSEARCH_URL");
        this.index = this.configService.get<string>("ELASTICSEARCH_INDEX") ?? "training-app-logs";
        this.username = this.configService.get<string>("ELASTICSEARCH_USERNAME");
        this.password = this.configService.get<string>("ELASTICSEARCH_PASSWORD");
    }

    async info(message: string, context?: string, metadata?: Record<string, unknown>) {
        await this.send({
            level: "info",
            message,
            context,
            metadata,
        });
    }

    async error(message: string, context?: string, metadata?: Record<string, unknown>) {
        await this.send({
            level: "error",
            message,
            context,
            metadata,
        });
    }

    private async send(payload: ElasticLogPayload) {
        if (!this.baseUrl) {
            return;
        }

        const url = `${this.baseUrl.replace(/\/$/, "")}/${this.index}/_doc`;
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (this.username && this.password) {
            headers["Authorization"] = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`;
        }

        try {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    ...payload,
                    timestamp: payload.timestamp ?? new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                this.logger.warn(`Failed to write log to Elasticsearch. Status: ${response.status}`);
            }
        } catch (error) {
            this.logger.warn(
                `Elasticsearch logging failed: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }
}
