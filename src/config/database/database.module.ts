import { DB_URL } from "@config/env.config";
import { Checkpoint } from "@models/checkpoint.model";
import { Comment } from "@models/comment.model";
import { Invite } from "@models/invite.model";
import { Project } from "@models/project.model";
import { ProjectInvite } from "@models/project_invite.model";
import { ProjectMember } from "@models/project_member.model";
import { Relation } from "@models/relation.model";
import { Task } from "@models/task.model";
import { User } from "@models/user.model";
import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      uri: DB_URL,
      models: [
        User,
        Invite,
        Project,
        ProjectMember,
        ProjectInvite,
        Relation,
        Task,
        Checkpoint,
        Comment
      ],
      autoLoadModels: true,
    })
  ]
})
export class DatabaseModule {}