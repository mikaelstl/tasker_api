import { Module } from "@nestjs/common";
import { TasksRepository } from "@modules/tasks/tasks.repository";
import { TasksController } from "@modules/tasks/task.controller";
import { TasksService } from "./tasks.service";

@Module({
  controllers: [
    TasksController,
  ],
  providers: [
    TasksRepository,
    TasksService,
  ],
  exports: [
    TasksService
  ]
})
export class TasksModule {}