import { Module } from "@nestjs/common";
import { EventsRepository } from "@modules/events/events.repository";
import { EventsController } from "@modules/events/events.controller";
import { EventsService } from "./events.service";

@Module({
  controllers: [
    EventsController,
  ],
  providers: [
    EventsRepository,
    EventsService,
  ],
  exports: [
    EventsService
  ]
})
export class EventsModule {}