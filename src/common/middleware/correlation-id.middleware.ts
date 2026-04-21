import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

export const CORRELATION_ID_HEADER = "x-correlation-id";

export type RequestWithCorrelationId = Request & {
    correlationId?: string;
};

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
    use(req: RequestWithCorrelationId, res: Response, next: NextFunction) {
        const incomingCorrelationId = req.header(CORRELATION_ID_HEADER);
        const correlationId = incomingCorrelationId?.trim() || crypto.randomUUID();

        req.correlationId = correlationId;
        res.setHeader(CORRELATION_ID_HEADER, correlationId);

        next();
    }
}
