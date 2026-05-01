import { Module } from "@nestjs/common";
import { CommentsRepository } from "@modules/comments/comments.repository";
import { CommentsController } from "@modules/comments/comment.controller";
import { CommentsService } from "./comments.service";

@Module({
  controllers: [
    CommentsController,
  ],
  providers: [
    CommentsRepository,
    CommentsService,
  ],
  exports: [
    CommentsService
  ]
})
export class CommentsModule {}