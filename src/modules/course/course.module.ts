import { Module } from '@nestjs/common';
import { CourseController } from './interface/course.controller';
import { CatalogController } from './interface/catalog.controller';
import { PrismaModule } from '@app/common/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { RabbitmqService } from './infrastructure/messaging/rabbitmq.service';
import { EventBus } from '@app/common/messaging/event-bus';
import { RabbitmqConsumerService } from './infrastructure/messaging/rabbitmq-consumer.service';
import { SnapshotService } from '@app/common/event-store/snapshot.service';
import { EventStoreService } from '@app/common/event-store/event-store.service';
import { CatalogListCacheService } from './application/services/catalog-list-cache.service';
import { CourseTransactionService } from './application/services/course-transaction.service';
import { EventService } from './application/services/event-service';
import { GetAllCourseUseCase } from './application/use-cases/get-all-course.usecase';
import { GetCourseUseCase } from './application/use-cases/get-course.usecase';
import { GetCatalogUseCase } from './application/use-cases/get-catalog.usecase';
import { GetAllCatalogUseCase } from './application/use-cases/get-all-catalog.usecase';
import { UpdateCourseUseCase } from './application/use-cases/update-course.usecase';
import { CreateCourseUseCase } from './application/use-cases/create-course.usecase';
import { PublishCourseUseCase } from './application/use-cases/publish-course.usecase';
import { PrismaEventRepository } from './infrastructure/persistence/prisma-event.repository';
import { PrismaCatalogRepository } from './infrastructure/persistence/prisma-catalog.repository';
import { EventRepository } from './domain/repositories/event.repository';
import { CatalogRepository } from './domain/repositories/catalog.repository';
import { CoursePublishedSaga } from './application/sagas/course-published.saga';
import { SagaManager } from '@app/common/saga/saga-manager';
import { Saga } from '@app/common/saga/saga.interface';
import { CourseRepository } from './domain/repositories/course.repository';
import { PrismaCourseRepository } from './infrastructure/persistence/prisma-course.repository';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
  ],
  providers: [
    PublishCourseUseCase,
    CreateCourseUseCase,
    UpdateCourseUseCase,
    GetAllCatalogUseCase,
    GetCatalogUseCase,
    GetCourseUseCase,
    GetAllCourseUseCase,
    EventService,
    CourseTransactionService,
    CatalogListCacheService,
    EventStoreService,
    SnapshotService,
    RabbitmqConsumerService,
    RabbitmqService,
    {
      provide: EventBus,
      useExisting: RabbitmqService,
    },
    CoursePublishedSaga,
    {
      provide: "SAGA_HANDLERS",
      useFactory: (coursePublishedSaga: CoursePublishedSaga) => [coursePublishedSaga],
      inject: [CoursePublishedSaga],
    },
    {
      provide: SagaManager,
      useFactory: (sagas: Saga[]) => new SagaManager(sagas),
      inject: ["SAGA_HANDLERS"],
    },
    {
      provide: CourseRepository,
      useClass: PrismaCourseRepository,
    },
    {
      provide: CatalogRepository,
      useClass: PrismaCatalogRepository,
    },
    {
      provide: EventRepository,
      useClass: PrismaEventRepository,
    }
  ],
  controllers: [CourseController, CatalogController],
  exports: [
    PublishCourseUseCase,
    EventService,
    CreateCourseUseCase,
    GetCatalogUseCase,
    GetAllCatalogUseCase,
    GetCourseUseCase,
    GetAllCourseUseCase,
    UpdateCourseUseCase,
    EventBus,
    RabbitmqService,
    RabbitmqConsumerService,
    SagaManager,
  ]
})
export class CourseModule { }
