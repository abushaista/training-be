import { Injectable, Logger } from "@nestjs/common";
import { Saga } from "./saga.interface";
import { EventEnvelope } from "@app/common/messaging/event-consumer";

@Injectable()
export class SagaManager {
    private readonly logger = new Logger(SagaManager.name);

    constructor(private readonly sagas: Saga[] = []) { }

    async execute(event: EventEnvelope) {
        const matchingSagas = this.sagas.filter((saga) => saga.supports(event));

        for (const saga of matchingSagas) {
            this.logger.log(`Executing saga ${saga.constructor.name} for event ${event.eventType}`);

            try {
                await saga.execute(event);
            } catch (error) {
                if (saga.rollback) {
                    this.logger.warn(
                        `Rolling back saga ${saga.constructor.name} for event ${event.eventType}`,
                    );
                    await saga.rollback(event);
                }

                throw error;
            }
        }
    }
}
